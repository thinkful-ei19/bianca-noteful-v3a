'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');


const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Tags', function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function () {
    return Tag.insertMany(seedTags)
    .then(() => Tag.createIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function () {

    it('should return the correct number of Tags', function () {
      const dbPromise = Tag.find();
      const apiPromise = chai.request(app).get('/api/tags');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          
        });
    });

    it('should return a list with the correct fields', function () {
        const dbPromise = Tag.find();
        const apiPromise = chai.request(app).get('/api/tags');
     
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.an('object');
            expect(item).to.have.keys('id', 'name');
         });
    
        });
    });
  });

  describe('GET /api/tags/:id', function () {

    it('should return correct folder for a given id', function () {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
    
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      const badId = '99-99-99';

      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for non-existent id', function () {

      return chai.request(app)
        .get('/api/tags/AAAAAAAAAAAAAAAAAAAAAAAA')
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

  });

  describe('POST /api/tags', function () {

    it('should create and return a new tag when provided valid data', function () {
      const newTag = {
        'name': 'Cats!'
      };
      let body;
      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(body).to.be.a('object');
          expect(body).to.have.keys('id', 'name');
          return Tag.findById(body.id);
        })
        .then(data => {
          expect(body.name).to.equal(data.name);
    
        });
    });

    it('should return an error when posting an object with a missing "name" field', function () {
      const newTag = {
        'foo': 'bar'
      };

      return chai.request(app)
        .post('/api/tags')
        .send(newTag)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

  });

  describe('PUT /api/tags/:id', function () {

    it('should update the tag when provided proper valid data', function () {
      const updateTag = {
        'name': 'Dogs'
      };
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/tags/${data.id}`)
            .send(updateTag);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name');

          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateTag.name);
        });
    });


    it('should respond with a 400 for improperly formatted id', function () {
      const updateTag = {
        'name': 'Dogs',
      };
      const badId = '99-99-99';

      return chai.request(app)
        .put(`/api/tags/${badId}`)
        .send(updateTag)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      const updateTag = {
        'name': 'Dogs'
      };

      return chai.request(app)
        .put('/api/tags/AAAAAAAAAAAAAAAAAAAAAAAA')
        .send(updateTag)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });

    it('should return an error when missing "name" field', function () {
      const updateTag = {
        'foo': 'bar'
      };

      return chai.request(app)
        .put('/api/tags/9999')
        .send(updateTag)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });

  });

  describe('DELETE  /api/tags/:id', function () {

    it('should delete a tag by id', function () {
      let data;
      return Tag.findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/tags/${data.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });

  });

});