var mongoose = require('mongoose');
var Song = mongoose.model('Song');
var path = require('path');
var appDir = path.dirname(require.main.filename);

function sendError(res, err) {
    res.statusCode = 503;
    res.send({err: err});
}
module.exports = function(app) {
    /**
     * Get array of all songs on server
     */
    app.get('/api/songs', function(req, res) {
        Song.find(function(err, songs) {
            res.send(songs);
        });
    });

    /**
     * Get a specific song item
     */
    app.get('/api/songs/:songId', function(req, res) {
        var id = req.params.songId;
        Song.findById(id, function(err, song) {
            if (!err) {
                res.send(song);
            } else {
                sendError(res, err);
            }
        });
    });

    /**
     * Refresh the dogecoin balance and return new song data
     */
    app.get('/api/songs/:songId/balance', function(req, res) {
        var id = req.params.songId;
        Song.findById(id, function(err, song) {
            if (err) {
                sendError(res, err);
            } else {
                song.updateBalance(function(err) {
                    if (err) {
                        sendError(res, err);
                    } else {
                        res.send(song);
                    }
                })
            }
        });
    });

    /**
     * Create a new song on the server
     */
    app.post('/api/songs', function(req, res) {
        var song = new Song({
            title: req.body.title,
            artist: req.body.artist
        });
        song.save(function(err) {
            if (!err) {
                song.generateAddress(function(err) {
                    if (!err) {
                        res.send(song);
                    } else {
                        sendError(res, err);
                    }
                });
            } else {
                sendError(res, err);
            }
        });
    });

    /**
     * Submit a new recording
     */
    app.post('/api/songs/:songId/recordings', function(req, res) {
        var songId = req.params.songId;

    });

    /**
     * Vote for a song - begin transaction session
     */
    app.post('/api/votes', function(req, res) {
        var songId = req.body.songId;
    });

    app.put('/api/votes/:voteId', function(req, res) {

    });

    /**
     * Get user data
     */
    app.get('/api/users/:id', function(req, res) {

    });
};