App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  // initialize app
  init: function() {
    return App.initWeb3();
  },
  // initialize web3
  // connects client side application to local blockchain
  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // set web3 provider to applications web3 provider
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // set default web3 provider from local blockchain instance
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  // initialize contract
  // loads contract into front-end application to interact with it
  initContract: function() {
    //load .json file form election artifact
    $.getJSON("Election.json", function(election) {
      // instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // listen for events emitted from the contract
  listenForEvents: function() {
    // deployed instance of contract
    App.contracts.Election.deployed().then(function(instance) {
      // restart Chrome if you are unable to receive this event
      instance.votedEvent({}, {
        // subscribe to events on entire blockchain
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // reload when a new vote is recorded
        App.render();
      });
    });
  },

  // render content of application on webpage
  // display account that is connected to blockchain
  // list out all of the candidates
  render: function() {
    // declare electionInstance variable to reference
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // load contract data
    // show candidates on the page
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      // get candidatescount
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      // loop to show candidates in our mapping
      // from 1 to number of candidates in candidatesCount
      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // render candidate result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // render candidate select option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      // acces voters mapping, check if account has already voted
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // hide form if they have already voted
      if(hasVoted) {
        $('form').remove();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  // function to place a vote
  castVote: function() {
    // select candidate Id
    var candidateId = $('#candidatesSelect').val();
    // get instance of deployed contract
    App.contracts.Election.deployed().then(function(instance) {
      // call vote function with candidateId from select
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});