const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {res.sendStatus(200)})
.get(cors.cors, authenticate.verifyUser, (req, res, ext) => {
    Favorites.find({ user: req.user._id})
    .populate("dishes")
    .populate("user")
    .then((favorite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
    }, (err) => { next(err) })
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if(!favorite) {
            Favorites.create({user: req.user._id})
            .then((newfavorite) => {
                console.log("new favorites created");
                newfavorite.dishes = newfavorite.dishes.concat(req.body);
                newfavorite.save()
                .then((newfavorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(newfavorite);
                }, (err) => next(err))
            }, err => next(err))
            .catch(err => next(err));
        }
        else {
            dishes = favorite.dishes.concat(req.body.map(dish => dish._id));
            favorite.dishes =  dishes.filter((item, pos) => dishes.indexOf(item) === pos);
            favorite.save()
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
            }, (err) => next(err))
        }
    }, err => next(err))
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({ user: req.user._id })
    .then(
    resp => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(resp);
    }, err => next(err))
    .catch(err => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => {res.sendStatus(200)})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if(!favorite) {
            Favorites.create({user: req.user._id})
            .then((newfavorite) => {
                newfavorite.dishes.push(req.params.dishId);
                newfavorite.save()
                .then((newfavorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(newfavorite);
                }, (err) => next(err))
            }, err => next(err))
            .catch(err => next(err));
        }
        else {
            index = favorite.dishes.indexOf(req.param.dishId);
            console.log("index:", index);
            if(index === -1) {
                err = new Error(`Favorite ${req.params.dishId} is alerady exist!`);
                err.status = 404;
                return next(err);
            }
            else {
                favorite.dishes.push(req.params.dishId);
                favorite.save()
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                }, (err) => next(err));
            }
        }
    }, err => next(err))
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then(
    favorites => {
        if (favorites) {
            index = favorites.dishes.indexOf(req.params.dishId);
            if(index !== -1) {
                favorites.dishes.splice(index, 1);
                favorites.save()
                .then(updatedFavorites => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(updatedFavorites);
            }, (err) => next(err));
            }
            else {
                err = new Error(`Favorite ${req.params.dishId} for user  ${req.user._id}  doesn't exist`);
                err.status = 404;
                return next(err);
            }
        }
        else {
            err = new Error(`Favorites for user  ${req.user._id}  doesn't exist`);
            err.status = 404;
            return next(err);
        }
    })
    .catch(err => next(err));
});

module.exports = favoriteRouter;

