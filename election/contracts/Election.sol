pragma solidity ^0.4.2;

contract Election{
	// Model candidates
	struct Candidate{
		uint id;
		string name;
		uint voteCount;
	}

	// store accounts that have voted
	// address = account key
	mapping(address => bool) public voters;
	

	// store candidates 
	// fetch candidates (Adding a candidate changes the state of the contract and writes to the blockchain)
	// key of uint will correspond to candidate ID
	mapping(uint => Candidate) public candidates;
	// candidates count
	uint public candidatesCount;

	// voted event
	event votedEvent (
		uint indexed _candidateId);

	// constructor
	function Election() public{
		addCandidate("Mark Rutte");
		addCandidate("Donald Trump");
	}

	// takes 1 arg (name of the candidate)
	function addCandidate (string _name) private{
		candidatesCount ++;
		// reference candidate mapping and pass key of the ID of the candidate we want to create (candidatesCount)
		candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
	}

	function vote (uint _candidateId) public {
		// check that account hasn't voted before
		// if require results in False, it will stop execution of code below
		// reference voters mapping and read account address as key
		// if voter has not voted before it will return as false, the ! causes the require to return True
		require(!voters[msg.sender]);

		// check if candidate is valid
		// ensure that candidateId is greater than 0 and lower or equal to the maximum candidatesCount
		require(_candidateId > 0 && _candidateId <= candidatesCount);

		// record that voter has voted
		// acces account that is voting and set value to true
		voters[msg.sender] = true;

		//update candidate vote count
		candidates[_candidateId].voteCount ++;

		votedEvent(_candidateId);
	}
}
