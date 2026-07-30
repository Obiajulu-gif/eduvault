import { describe, it, expect, beforeEach } from 'vitest';
import { mockCollections } from '../setup';
import { users, materials } from '../fixtures';

import { POST as CloseMaterial } from '../../src/app/api/materials/[id]/close/route.js';
import { POST as CancelMaterial } from '../../src/app/api/materials/[id]/cancel/route.js';
import { POST as PublishMaterial } from '../../src/app/api/materials/[id]/publish/route.js';
import { PUT as UpdateMaterial } from '../../src/app/api/materials/route.js';

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';

function authedRequest(url, { method = 'POST', body, wallet = users.creator.walletAddress } = {}) {
    return new Request(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-wallet': wallet },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
}

describe('Material lifecycle transitions', () => {
    beforeEach(() => {
        mockCollections.materials.findOne.mockReset();
        mockCollections.materials.findOneAndUpdate.mockReset();
        mockCollections.materials.updateOne.mockReset();
        mockCollections.material_status_history.insertOne.mockReset();
        mockCollections.purchases.countDocuments.mockReset().mockResolvedValue(0);
    });

    it('closes a published material', async () => {
        mockCollections.materials.findOne.mockResolvedValue(materials.published);
        mockCollections.materials.findOneAndUpdate.mockResolvedValue({
            ...materials.published,
            status: 'closed',
        });

        const req = authedRequest(`http://localhost/api/materials/${materials.published._id}/close`);
        const res = await CloseMaterial(req, { params: { id: materials.published._id } });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('status', 'closed');
        expect(mockCollections.material_status_history.insertOne).toHaveBeenCalledWith(
            expect.objectContaining({ previousStatus: 'published', nextStatus: 'closed' })
        );
    });

    it('rejects canceling a published material with confirmed purchases (409)', async () => {
        mockCollections.materials.findOne.mockResolvedValue(materials.published);
        mockCollections.purchases.countDocuments.mockResolvedValue(1);

        const req = authedRequest(`http://localhost/api/materials/${materials.published._id}/cancel`);
        const res = await CancelMaterial(req, { params: { id: materials.published._id } });
        const data = await res.json();

        expect(res.status).toBe(409);
        expect(data).toHaveProperty('code', 'precondition_failed');
        expect(mockCollections.materials.findOneAndUpdate).not.toHaveBeenCalled();
        expect(mockCollections.material_status_history.insertOne).not.toHaveBeenCalled();
    });

    it('cancels a published material with no confirmed purchases', async () => {
        mockCollections.materials.findOne.mockResolvedValue(materials.published);
        mockCollections.purchases.countDocuments.mockResolvedValue(0);
        mockCollections.materials.findOneAndUpdate.mockResolvedValue({
            ...materials.published,
            status: 'canceled',
        });

        const req = authedRequest(`http://localhost/api/materials/${materials.published._id}/cancel`);
        const res = await CancelMaterial(req, { params: { id: materials.published._id } });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('status', 'canceled');
    });

    it('rejects an invalid transition (closed -> published) with a typed 409 and does not mutate data', async () => {
        mockCollections.materials.findOne.mockResolvedValue({ ...materials.published, status: 'closed' });

        const req = authedRequest(`http://localhost/api/materials/${materials.published._id}/publish`);
        const res = await PublishMaterial(req, { params: { id: materials.published._id } });
        const data = await res.json();

        expect(res.status).toBe(409);
        expect(data).toHaveProperty('code', 'invalid_transition');
        expect(mockCollections.materials.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects a transition from someone other than the owner or an admin (403)', async () => {
        mockCollections.materials.findOne.mockResolvedValue(materials.published);

        const req = authedRequest(`http://localhost/api/materials/${materials.published._id}/close`, {
            wallet: 'GSOMEONEELSEENTIRELYDIFFERENTWALLETADDRESSXXXXXXXXXXXXXX',
        });
        const res = await CloseMaterial(req, { params: { id: materials.published._id } });
        const data = await res.json();

        expect(res.status).toBe(403);
        expect(data).toHaveProperty('code', 'forbidden');
        expect(mockCollections.materials.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('reports a 409 conflict when the status changed concurrently between read and write', async () => {
        mockCollections.materials.findOne.mockResolvedValue(materials.published);
        // Simulates another request winning the race: the guarded filter no longer matches.
        mockCollections.materials.findOneAndUpdate.mockResolvedValue(null);

        const req = authedRequest(`http://localhost/api/materials/${materials.published._id}/close`);
        const res = await CloseMaterial(req, { params: { id: materials.published._id } });
        const data = await res.json();

        expect(res.status).toBe(409);
        expect(data).toHaveProperty('code', 'conflict');
        expect(mockCollections.material_status_history.insertOne).not.toHaveBeenCalled();
    });

    it('rejects a generic PUT update that tries to set status directly', async () => {
        const req = authedRequest(`http://localhost/api/materials?id=${VALID_OBJECT_ID}`, {
            method: 'PUT',
            body: { status: 'published' },
        });

        const res = await UpdateMaterial(req);

        expect(res.status).toBe(400);
        expect(mockCollections.materials.findOneAndUpdate).not.toHaveBeenCalled();
        expect(mockCollections.materials.updateOne).not.toHaveBeenCalled();
    });
});
