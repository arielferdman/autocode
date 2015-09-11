crystal = require '../../../src/crystal'

describe 'crystal', () ->
  describe 'validate', () ->
    describe 'description', () ->
      it 'should be optional', () ->
        (-> new crystal {})
          .should.not.throw "'description' is required."
        
      it 'should be a string', () ->
        # object description
        config = {
          name: 'test'
          version: '1.0.0'
          description: {}
        }
        (-> new crystal config)
          .should.throw "`description` must be a `string`, not a `object`."