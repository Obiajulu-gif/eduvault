import { describe, it, expect, beforeEach } from 'vitest';
import { mockCollections } from '../setup';
import { users, materials } from '../fixtures';

// Assuming standard Next.js Route handlers export GET/POST
import { POST as CreateMaterial } from '../../src/app/api/materials/route.js';
import { POST as PublishMaterial } from '../../src/app/api/materials/[id]/publish/route.js';

describe('Material Publishing Flow', () => {
    beforeEach(() => {
        mockCollections.materials.insertOne.mockClear();
        mockCollections.materials.updateOne.mockClear();
        mockCollections.materials.findOne.mockClear();
        mockCollections.materials.findOneAndUpdate.mockClear();
        mockCollections.material_status_history.insertOne.mockClear();
    });

    it('successfully creates a draft material record', async () => {
        const req = new Request('http://localhost/api/materials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-wallet': users.creator.walletAddress },
            body: JSON.stringify(materials.draft),
        });

        mockCollections.materials.insertOne.mockResolvedValue({ insertedId: materials.draft._id });

        const res = await CreateMaterial(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data).toHaveProperty('success', true);
        expect(data.materialId).toBe(materials.draft._id);
    });

    it('fails publish validation if material ID is invalid', async () => {
        mockCollections.materials.findOne.mockResolvedValue(null);

        const req = new Request('http://localhost/api/materials/invalid_id/publish', {
            method: 'POST',
            headers: { 'x-user-wallet': users.creator.walletAddress },
        });
        const res = await PublishMaterial(req, { params: { id: 'invalid_id' } });
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data).toHaveProperty('error', 'Material not found');
    });

    it('successfully publishes a draft material', async () => {
        mockCollections.materials.findOne.mockResolvedValue(materials.draft);
        mockCollections.materials.findOneAndUpdate.mockResolvedValue({
            ...materials.draft,
            status: 'published',
        });

        const req = new Request(`http://localhost/api/materials/${materials.draft._id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-wallet': users.creator.walletAddress },
            // Simulating passing on-chain registry details back to backend
            body: JSON.stringify({ contractId: 'C_NEW_CONTRACT' }),
        });

        const res = await PublishMaterial(req, { params: { id: materials.draft._id } });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('status', 'published');
        expect(mockCollections.materials.findOneAndUpdate).toHaveBeenCalled();
        expect(mockCollections.material_status_history.insertOne).toHaveBeenCalledWith(
            expect.objectContaining({ previousStatus: 'draft', nextStatus: 'published' })
        );
    });

    it('is idempotent when publishing an already-published material', async () => {
        mockCollections.materials.findOne.mockResolvedValue(materials.published);

        const req = new Request(`http://localhost/api/materials/${materials.published._id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-wallet': users.creator.walletAddress },
        });

        const res = await PublishMaterial(req, { params: { id: materials.published._id } });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toHaveProperty('alreadyPublished', true);
        expect(mockCollections.materials.findOneAndUpdate).not.toHaveBeenCalled();
        expect(mockCollections.material_status_history.insertOne).not.toHaveBeenCalled();
    });
});
