import hashlib
import json
from time import time
from flask import Flask, jsonify, request, render_template


global voted, votedforcount
voted = []
votedforcount = []
class Blockchain:
    def __init__(self):
        self.current_transactions = []
        self.chain = []
        self.nodes = set()

        # creeer originele block
        self.new_block(previous_hash='1', proof=100)


    def valid_chain(self, chain):
        """
        veriefieer of de chain valide is
        """

        last_block = chain[0]
        current_index = 1

        while current_index < len(chain):
            block = chain[current_index]
            print(f'{last_block}')
            print(f'{block}')
            print("\n-----------\n")
            # Check of de hash van de block correct is
            last_block_hash = self.hash(last_block)
            if block['previous_hash'] != last_block_hash:
                return False

            # Check of de proof of work klopt
            if not self.valid_proof(last_block['proof'], block['proof'], last_block_hash):
                return False

            last_block = block
            current_index += 1

        return True


    def new_block(self, proof, previous_hash):
        """
        Maakt een nieuwe block aan en voegt huidige toe aan de chain
        """

        block = {
            'index': len(self.chain) + 1,
            'timestamp': time(),
            'transactions': self.current_transactions,
            'proof': proof,
            'previous_hash': previous_hash or self.hash(self.chain[-1]),
        }

        # Reset current transactions
        self.current_transactions = []

        self.chain.append(block)
        return block

    def new_transaction(self, sender, recipient, amount, key):
        """
        maak een nieuwe transaction aan voor in de block die gemined gaat worden

        checkt ook of de public en private key kloppen zoals ze verder beneden worden toegevoegd aan de Users lijst.
        """
        global Users
        for x in Users:
            if  x["public"]== sender:
                if x["private"] ==  key:
                    self.current_transactions.append({
                        'sender': sender,
                        'recipient': recipient,
                        'amount': amount,
                    })
                    return self.last_block['index'] + 1

        return 'no'

    @property
    def last_block(self):
        return self.chain[-1]

    @staticmethod
    def hash(block):
        """
        maakt een hash aan van de block
        """
        block_string = json.dumps(block, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def proof_of_work(self, last_block):
        """
        Proof of work algorithm
        """

        last_proof = last_block['proof']
        last_hash = self.hash(last_block)

        proof = 0
        while self.valid_proof(last_proof, proof, last_hash) is False:
            proof += 1

        return proof

    @staticmethod
    def valid_proof(last_proof, proof, last_hash):
        """
        Checkt of de proof klopt

        """

        guess = f'{last_proof}{proof}{last_hash}'.encode()
        guess_hash = hashlib.sha256(guess).hexdigest()
        return guess_hash[:4] == "0000"


class User:
    global Users
    def __init__(self, private, public):
        """
        maakt de users aan zodat we kunnen checken of de public en private keys kloppen

        """
        self.Privatekey = private
        self.Publickey = public
        user = {
            'private': self.Privatekey,
            'public': self.Publickey
        }
        Users.append(user)

app = Flask(__name__)


#maakt users aan, (normaal zouden deze keys van de overheid komen, en er anders uit zien. voor het gemak hebben we het zo gedaan)
global Users
Users = []
User("1234567890", "1234567890")
User("1234567891", "1234567891")
User("1234567892", "1234567892")
User("1234567893", "1234567893")
User("1234567894", "1234567894")
User("1234567895", "1234567895")
User("1234567896", "1234567896")
User("1234567897", "1234567897")
User("1234567898", "1234567898")
User("1234567899", "1234567899")
# maakt blockchain aan
blockchain = Blockchain()

#votes
global DT, MR

DT = 0
MR = 0



@app.route('/mine', methods=['GET'])
def mine():
    # verkrijgen van de nieuwe proof
    last_block = blockchain.last_block
    proof = blockchain.proof_of_work(last_block)

    # de reward die verkregen wordt voor het vinden van de nieuwe proof
    blockchain.new_transaction(
        sender="0",
        recipient="unknown",
        amount=1,
        key=1
    )

    # voeg de block toe aan de chain en krijgt de nieuwe block terug van de new_block functie
    previous_hash = blockchain.hash(last_block)
    block = blockchain.new_block(proof, previous_hash)
    #laad homepage opnieuw om het nieuwe aantal stemmen weer te geven
    response = {
        'message': "New Block Forged",
        'index': block['index'],
        'transactions': block['transactions'],
        'proof': block['proof'],
        'previous_hash': block['previous_hash'],
    }
    print(response)
    return HomePage()


@app.route('/new_transaction', methods=['POST'])
def new_transaction():
    #nieuwe vote
    sender = request.form['sender']
    recipient = request.form['recipient']
    key = request.form['key']
    amount = 5
    #zorgt ervoor dat een persoon niet 2 keer vote
    if not sender in voted:
        index = blockchain.new_transaction(sender, recipient, amount, key)
        if index == 'no':
            return "You are not in the system", 400
        else:
            voted.append(sender)
            response = {'message': f'Transaction will be added to Block {index}'}
            print(response)
            return HomePage()
    return 'You already voted', 400


@app.route('/chain', methods=['GET'])
def full_chain():
    #weergave van chain
    response = {
        'chain': blockchain.chain,
        'length': len(blockchain.chain),
    }
    return jsonify(response), 200

@app.route('/transactions', methods=['GET'])
def all_transactions():
    #weergave van huidige transacties
    response = {
        'block': blockchain.current_transactions
    }
    return jsonify(response), 200


@app.route('/home', methods=['GET'])
def HomePage():
    votes = []
    global DT, MR
    #laden van de votes en renderen van de homepage

    for block in blockchain.chain:
        for tx in block["transactions"]:
            rc = tx["recipient"]
            sd = tx["sender"]
            if not sd in votedforcount:
                votes.append(rc)
                votedforcount.append(sd)

    for x in votes:
        if x == "DonaldTrump":
            DT += 1
        if x == "MarkRutte":
            MR += 1

    Candidates = []

    item = dict(id=1, name="Mark Rutte", votes=MR)
    item2 = dict(id=2, name="Donald Trump", votes=DT)

    Candidates.append(item)
    Candidates.append(item2)

    return render_template('home.html', title='Home', candidates=Candidates)

@app.route('/handle_data', methods=['POST'])
def handle_data():
    projectpath = request.form['projectFilepath']
    print(projectpath)


if __name__ == '__main__':
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument('-p', '--port', default=5000, type=int, help='port to listen on')
    args = parser.parse_args()
    port = args.port

    app.run(host='0.0.0.0', port=port)
