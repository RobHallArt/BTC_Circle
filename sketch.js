/*

Hosted at doc.gold.ac.uk/~rhall003/BTC_Circle/

I wanted to create a drawing that recieved stimulus from a
bitcoin api. I found a webSocket api that allows me to recieve
the value of and call a function every time a transaction
happens on the network. I wrote a basic particle system which
adds a new particle every time a transaction occurs.

The first system I wrote featured orbs that floated up based
on a volume of bitcoin index I calculated from the last 10
transactions, weighted towards the latest transaction.

The second (current) system also used this index but as a value
for the distance from the center for circles orbiting the center
of the screen. This design was inspired loosely by the tardis
scanner design from doctor who which features circles orbiting
a central point.

In my version each circle indicates a transaction and the size of
the circle indicates the value of that transaction. When a high
value transaction occurs this skews the index and the circles
appear to fly out. The index is eased before it is applied in
order to stabilise the effect it has on the visuals as it moves
in big steps which create a disjointed effect.

*/


// Declare Variables.
var socket;
var data;
var btcVolume = 0;
var btcVolEase = 0;
var bubbles = [];
var pastTransactions = new Array(10);

// Make Sure Variable is Full.
for(var i = 0; i<pastTransactions.length;i++){
    pastTransactions[i] = 0;
}



function setup()
{
    
    socket = new WebSocket("wss://ws.blockchain.info/inv"); // Create New Socket.
    socket.onopen = function(){ // Set what happens when socket is opened.
        socket.send(JSON.stringify({"op":"unconfirmed_sub"})); // Send Message to subscribe to Bitcoin Transaction Updates.
    }

    socket.onmessage = function(onmsg){ // Set what happens when a message is recieved.
        var response = JSON.parse(onmsg.data); // Pass data to JSON Parser.
        // loop over transaction values and calculate actual value.
        for(var i=0; i<response.x.out.length;i++){
            var amount = response.x.out[i].value;
            var calAmount = amount / 100000000;
            
            calcBTCVolume(calAmount); // Run function to update volume index.
            bubbles.push(new bubble(calAmount)); // Add a new bubble.
        }
    }
    
    createCanvas(1280,720); // Create Any Size Canvas.
    frameRate(60); // Set Optomistic Frame Rate.
    noFill(); // Stop Drawing inside of shapes.
}

function draw()
{

    background(0);
    
    btcVolEase +=(btcVolume - btcVolEase)*0.01; // Create Eased Version of BTC.
    
    for(var i = 0; i<bubbles.length; i++){ // Loop over Bubbles.
        bubbles[i].draw(); // Draw each Bubble.
    }
    
    for(var i = 0; i<bubbles.length; i++){ // Loop over Bubbles.
        if(bubbles[i].position.y+bubbles[i].size<0){ // If Bubble is off Screen.
            bubbles.splice(i,1); // Delete Bubble From Array.
        }
    }

}

function bubble(_val){ // Declare Bubble.
    this.position = createVector(width/2, height/2); //Set initial Position.
    this.BTCVal = _val; // Set its own value to passed value of BTC.
    this.seed = random(0,360); // Generate Random Seed for rotation.
    this.distFromCenter = 0; // Initial Dist From Center.
    this.speed = random(0.5,1.5); // Generate Random Speed.
    this.size = this.BTCVal*100; // Calculate Size from BTC Value.
    this.draw = function(){ // Set Draw Function.
        
        this.physics(); // Run Physics Before Drawing.
        stroke(255,125); // Set Stroke Details.
        strokeWeight(2); // Set Width of Stroke.
        ellipse(this.position.x,this.position.y,this.size,this.size); // Draw Ellipse.
        
    }
    
    this.physics = function(){ // Calculate Values for Draw.
        this.distFromCenter -= btcVolEase; // Dist from center increased by Bitcoin volume index.
        this.position.x = map(sin(radians((frameCount/3*this.speed)+this.seed%360)+PI/2),-1,1,map(this.distFromCenter,0,width/2,width/2,0),map(this.distFromCenter,0,width/2,width/2,width)); // Set X point based on sin, framecount and distfromcenter.
        this.position.y = map(sin(radians((frameCount/3*this.speed)+this.seed%360)),-1,1,map(this.distFromCenter,0,height/2,height/2,0),map(this.distFromCenter,0,height/2,height/2,height)); // Set Y point based on sin, framecount and distfromcenter.
        
    }
    
}

function calcBTCVolume(_val){
    for(var i = 1; i<pastTransactions.length; i++){ // Loop over array of past Bitcoin values.
        pastTransactions[i] = pastTransactions[i-1]; //Move Values Up Array
    }
    pastTransactions[0] = _val; // Set latest Value to latest Value.
    
    btcVolume = 0; // reset index value.
    
    for(var i = 0; i<pastTransactions.length; i++){ // Loop over array of past Bitcoin values.
        btcVolume = btcVolume + pastTransactions[i]/(i+1); // Add weighted values to index value.
    }
    
    btcVolume = btcVolume/pastTransactions.length; // Divide by values for average.
}