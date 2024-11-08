const fetch = require('node-fetch');
const GOOGLE_API_KEY = "AIzaSyCJgOiSJeJlRdoFK_jTK-mNug5b22XPRn4";
const PLACE_ID = 'ChIJfwLDmngzhEcRLj0HxpoQbIg';

const getReviews = async (req, res) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&key=${GOOGLE_API_KEY}&fields=reviews`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.result && data.result.reviews) {
            res.status(200).json({
                success: true,
                reviews: data.result.reviews,
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No reviews found or invalid response from Google Places API.',
                error: data.error_message || data.status,
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the reviews.',
            error: error.message,
        });
    }
};

module.exports = {
    getReviews,
};
