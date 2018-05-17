// tests to simulate Client-Side interactions with our contract

// using Mocha testing framework

// smart Contract
var Election = artifacts.require("./Election.sol");

// declare contract - Inject all the accounts that exist in development environment
contract("Election", function(accounts){
	// store variable inside of scope
	var electionInstance;

	// test initialisation with correct number candidates
	it("initializes with two candidates", function(){
		//fetch instance deployed contract
		return Election.deployed().then(function(instance){
			//fetch candidatesCount
			return instance.candidatesCount();
		}).then(function(count){
			// check if value(candidatesCount) == 2
			assert.equal(count, 2);
		});
	});

	// test intialisation with correct values (id, name, votecount)
	it("initializes candidates with correct values", function(){
		return Election.deployed().then(function(instance){
			// assign variable to access instance within promise chain
			electionInstance = instance;
			// call candidates function from mapping
			return electionInstance.candidates(1);
		}).then(function(candidate){
			// reference values by index
			assert.equal(candidate[0], 1, "contains the correct id");
			assert.equal(candidate[1], "Mark Rutte", "contains the correct name");
			assert.equal(candidate[2], 0, "contains the correct votes count");
			return electionInstance.candidates(2);
		}).then(function(candidate){
			assert.equal(candidate[0], 2, "contains the correct id");
			assert.equal(candidate[1], "Donald Trump", "contains the correct name");
			assert.equal(candidate[2], 0, "contains the correct votes count");
		});
	});

	// check that function increments votecount
	// check that voter was added to mapping we created (so program knows what account has already voted)
	it("allows a voter to cast a vote", function(){
		return Election.deployed().then(function(instance){
			// assign variable to acces instance within promise chain
			electionInstance = instance;
			candidateId = 1;
			// pass candidateId and function metadata to specify which account is voting
			return electionInstance.vote(candidateId, { from: accounts[0]});
			// return value of vote function injected here
		}).then(function(receipt){
			// read account out of voters mapping
			// check transaction receipt has 1 log
			assert.equal(receipt.logs.length, 1, "an event was triggered");
			// acces event and ensure it's the correct eventtype
			assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
			// check that arguments inside event identy candidateId
			assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
			return electionInstance.voters(accounts[0]);
		}).then(function(voted){
			// return boolean value wether account has voted or not
			assert(voted, "the voter was marked as voted");
			// fetch candidate out of mapping
			return electionInstance.candidates(candidateId);
		}).then(function(candidate){
			// read number of votes candidate has received
			var voteCount = candidate[2];
			// assert equal to 1 cause we have only voted 1 time and candidate should only have 1 vote at this point
			assert.equal(voteCount, 1, "increments the candidate's vote count");
		})
	});
/*
	it("throws an exception for invalid candidates", function(){
		// get instance of deployed contract
		return Election.deployed().then(function(instance){
			electionInstance = instance;
			// vote once for candidate 99, candidate 99 is invalid
			return electionInstance.vote(99, { from: accounts[1]})
			// assert that failure happened
		}).then(assert.fail).catch(function(error){
			// check if error message has word "revert" in it
			assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
			return electionInstance.candidates(1)
		}).then(function(candidate1) {
			var voteCount = candidate1[2];
			// check if votecount is unaltered
			// assert that votecount is still 1 (1 because we already voted 1 time in our tests)
			assert.equal(voteCount, 1, "Mark Rutte did not receive any votes");
		}).then(function(candidate2){
			// check if votecount is unaltered
			// assert that votecount is still 0 (0 because we have not yet voted in our tests)
			var voteCount = candidate2[2];
			assert.equal(voteCount, 0, "Donald Trump did not receive any votes");
		});
	});
*/
	// check that account cannot vote twice
	it("throws an exception for double voting", function(){
		// instance of contract
		return Election.deployed().then(function(instance){
			electionInstance = instance;
			candidateId = 2;
			// vote once from account nr. 1
			electionInstance.vote(candidateId, { from: accounts[1]});
			return electionInstance.candidates(candidateId);
			// read candidate out of candidates mapping
		}).then(function(candidate){
			// check if first vote works
			var voteCount = candidate[2];
			assert.equal(voteCount, 1, "accepts first vote");
			// vote again on the same account
			return electionInstance.vote(candidateId, {from: accounts[1]});
			// assert that failure happened
		}).then(assert.fail).catch(function(error){
			// check if error message has word "revert" in it
			assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
			return electionInstance.candidates(1);
		}).then(function(candidate1){
			// test that votecount did not go up for either candidate
			var voteCount = candidate1[2];
			assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
			return electionInstance.candidates(2);
		}).then(function(candidate2){
			var voteCount = candidate2[2];
			assert.equal(voteCount, 1, "candidate 2 did not receive any votes");
		});
	});
});