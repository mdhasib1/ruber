const FAQ = require('../Models/Faq.Schema');
// Get all FAQs
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch FAQs.', error: error.message });
  }
};

// Add a new FAQ
exports.addFAQ = async (req, res) => {
    console.log(req.body)
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ success: false, message: 'Question and Answer in all languages are required.' });
  }

  try {
    const newFAQ = new FAQ({ question, answer });
    await newFAQ.save();
    res.status(201).json({ success: true, message: 'FAQ added successfully.', data: newFAQ });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add FAQ.', error: error.message });
  }
};

// Delete an FAQ
exports.deleteFAQ = async (req, res) => {
  const { id } = req.params;

  try {
    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found.' });
    }
    res.status(200).json({ success: true, message: 'FAQ deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete FAQ.', error: error.message });
  }
};
