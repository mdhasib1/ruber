// ContractRuleController.js
const ContractRule = require('../Models/ContractRule.Schema');

exports.createContractRule = async (req, res) => {
  try {
    const { title } = req.body;
    const newRule = new ContractRule({ title });
    await newRule.save();
    res.status(201).json({ message: 'Contract rule created successfully', rule: newRule });
  } catch (error) {
    console.error("Error creating contract rule:", error);
    res.status(500).json({ error: 'Failed to create contract rule' });
  }
};

exports.editContractRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    const updatedRule = await ContractRule.findByIdAndUpdate(ruleId, updates, { new: true });
    if (!updatedRule) return res.status(404).json({ error: 'Contract rule not found' });
    res.status(200).json({ message: 'Contract rule updated successfully', rule: updatedRule });
  } catch (error) {
    console.error("Error updating contract rule:", error);
    res.status(500).json({ error: 'Failed to update contract rule' });
  }
};

exports.deleteContractRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const deletedRule = await ContractRule.findByIdAndDelete(ruleId);
    if (!deletedRule) return res.status(404).json({ error: 'Contract rule not found' });
    res.status(200).json({ message: 'Contract rule deleted successfully' });
  } catch (error) {
    console.error("Error deleting contract rule:", error);
    res.status(500).json({ error: 'Failed to delete contract rule' });
  }
};

exports.getAllContractRules = async (req, res) => {
  try {
    const rules = await ContractRule.find();
    res.status(200).json({ rules });
  } catch (error) {
    console.error("Error fetching contract rules:", error);
    res.status(500).json({ error: 'Failed to fetch contract rules' });
  }
};
