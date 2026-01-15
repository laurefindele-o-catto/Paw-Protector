const VetApprovedModel = require('../models/vetApprovedModel.js');
const VetDeclinedModel = require('../models/vetDeclinedModel.js');
const PetHealthCheckModel = require('../models/petHealthCheckModel.js');

class VetDashboardController {
    constructor() {
        this.vetApprovedModel = new VetApprovedModel();
        this.vetDeclinedModel = new VetDeclinedModel();
        this.petHealthCheckModel = new PetHealthCheckModel();
    }

    overview = async (req, res) => {
        try {
            const vetId = req.user.id;
            const approvals = await this.vetApprovedModel.getApprovalsByVet(vetId);
            const declines = await this.vetDeclinedModel.getDeclinesByVet(vetId, 50);

            const approvalsRecent = approvals.slice(0, 5);
            const declinesRecent = declines.slice(0, 5);

            const healthCounts = await this.petHealthCheckModel.countForVet(vetId);
            const healthSummary = await this.petHealthCheckModel.getVetPetSummary(vetId, 50);

            return res.status(200).json({
                success: true,
                mlDiagnostics: {
                    approvedCount: approvals.length,
                    declinedCount: declines.length,
                    recentApproved: approvalsRecent,
                    recentDeclined: declinesRecent,
                },
                petHealthChecks: {
                    pendingCount: healthCounts.pending || 0,
                    respondedCount: healthCounts.responded || 0,
                    petsCheckedSummary: healthSummary,
                },
            });
        } catch (error) {
            console.error('Vet dashboard overview error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = VetDashboardController;
