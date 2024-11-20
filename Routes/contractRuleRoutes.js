// contractRuleRoutes.js
const express = require('express');
const router = express.Router();
const ContractRuleController = require('../Controllers/ContractRuleController');

router.post('/contractrule', ContractRuleController.createContractRule);
router.put('/contractrule/:ruleId', ContractRuleController.editContractRule);
router.delete('/contractrule/:ruleId', ContractRuleController.deleteContractRule);
router.get('/contractrules', ContractRuleController.getAllContractRules);

module.exports = router;
