'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Tag = require('../models/tag');
const Note = require('../models/note');
/* ==== GET/READ ALL TAGS ==== */

router.get('/tags', (req, res, next) => {

  Tag
    .find()
    .sort('name')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ==== GET/READ A SINGLE TAG ==== */
router.get('/tags/:id', (req,res,next) => {
  const { id } = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('The `id` is not valid');
      err.status = 400;
      return next(err);
  }

  Tag
  .findById(id)
  .then(result => {
      if(result) {
          res.json(result);
      } else {
          next();
      }
  })
  .catch(err => {
      next(err);
  });
});

/* ===== POST/CREATE A TAG ===== */
router.post('/tags', (req, res, next) => {
  const { name } = req.body;
  const newTag = {name};

/*** Never trust users - validate input ***/
  if(!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  Tag
    .create(newTag)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
    if(err.code === 11000){
        err = new Error('The folder name already exists');
        err.status = 400;
    }
      next(err);
  });
});
/* ========== PUT/UPDATE A SINGLE FOLDER ========== */
router.put('/tags/:id', (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;
    
  
    /***** Never trust users - validate input *****/
    if (!name) {
      const err = new Error('Missing `name` in request body');
      err.status = 400;
      return next(err);
    }
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('The `id` is not valid');
      err.status = 400;
      return next(err);
    }
  
    const updateTag = { name };
    const options = { new: true };
    
  
    Tag
      .findByIdAndUpdate(id, updateTag, options)
      .then(result => {
        if (result) {
          res.json(result);
        } else {
          next();
        }
      })
      .catch(err => {
      if(err.code === 11000) {
          err = new Error('The tag name already exists');
          err.status = 400;
      }
        next(err);
      });
  });
  
  /* ========== DELETE/REMOVE A SINGLE FOLDER ========== */
  router.delete('/tags/:id', (req, res, next) => {
    const { id } = req.params;
    const tagRemovePromise =  Tag.findByIdAndRemove(id);
    // removing tag with a certain id
    const noteUpdatePromise = Note.updateMany(
      {'tags':id,},
      {'$pull': {'tags': id}}
    );
    //updating all notes with a certain tag id

    Promise.all([tagRemovePromise, noteUpdatePromise])
      .then(([tagResults]) => {
        if(tagResults) {
          res.status(204).end();
        } else {
          next();
        }
      })
      .catch(err => {
        next(err);
      });
  });


module.exports = router;