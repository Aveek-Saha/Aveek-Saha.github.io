var Preload = function(game){};

Preload.prototype = {

	preload: function(){ 
		this.game.load.image('tile', 'assets/tile.png');
		this.game.load.image('box', 'assets/box.png');
		// this.game.load.image('player', 'assets/player.png');
		this.game.load.spritesheet('player', 'assets/player.png', 24, 24, 9, -2);
		// this.game.load.image('forest', 'assets/forest.png');

		this.game.load.image('cloud', 'assets/cloud.jpg');
		this.game.load.image('bg1', 'assets/plx-1.png');
		this.game.load.image('bg2', 'assets/plx-2.png');
		this.game.load.image('bg3', 'assets/plx-3.png');
		this.game.load.image('bg4', 'assets/plx-4.png');
		this.game.load.image('bg5', 'assets/plx-5.png');
		

	},

	create: function(){
		this.game.state.start("Main");
	}
}