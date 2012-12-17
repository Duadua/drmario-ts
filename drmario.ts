// Dr Mario JS
// by Radoslav Kirov
// last updated February 2011 
// under BY-NC-SA CC license
// http://creativecommons.org/licenses/by-nc-sa/3.0/us/
// Conversion to TypeScript by vclayton

var canvas = <HTMLCanvasElement>document.getElementById('canvas'),
ctx = canvas.getContext('2d'), 
FPS = 24,
//games = [],
colors = ['#000000','#dfb700','#0000fc','#cc0000'],
interval,
init,
N = [
	[[0,2],[0,4]],
	[[3,1],[0,0]],
	[[2,0],[4,0]],
	[[0,0],[3,1]]
	],
blocks = [], // List of which pieces will be delivered next
COLORS = 3,
wins = [0,0];


class Block
{
	public neighbors = 0;

	constructor(public x: number, public y: number, public speed: number, public a: Array) {
	}

	public draw(view: CanvasView) {
		var i, j;
		for (i = 0; i < this.a.length; i++) {
			for (j = 0; j < this.a[0].length; j++) {
				if (this.a[i][j] === 0) {
					continue;
				}
				view.draw_block(this.x + i, this.y + j, colors[this.a[i][j]], N[this.neighbors][i][j]);
			}
		}
	}
}



var R = 0.3;
class CanvasView
{
	private hpill = [
		[-1, -1],
		[-1, 1 - R],
		[-1 + R, 1],
		[1 - R, 1],
		[1, 1 - R],
		[1, -1]
	];
	private pill = [
		[-1 + R, -1],
		[-1 , -1 + R],
		[-1 , 1 - R],
		[-1 + R , 1 ],
		[1 - R , 1 ],
		[1 , 1 - R],
		[1 , -1 + R],
		[1 - R , -1]
	];
	private blocksize=20;

	constructor(public ctx, public game: Game)
	{
	}

	public draw()
	{
		var i,j;
		var game = this.game;
		for (i = 0; i < game.tx; i++){
			for (j = 0; j < game.ty; j++){
				if (game.state[i][j] === 0){
					continue;
				}
				if (game.state[i][j] === -1){
					ctx.fillStyle = colors[0];
				}
				this.draw_block(i, j, colors[game.state[i][j]], game.neighbors[i][j]);
				if (game.initial[i][j] === 1){
					this.draw_virus(i, j);
				}
			}
		}
		for (i = 0; i < game.falling.length; i++){
			game.falling[i].draw(this);
		}
		ctx.strokeRect(0, 0, game.tx * this.blocksize, game.ty * this.blocksize);
		this.draw_chrome(game);
		this.display_messages(game);
	}

	public draw_chrome(game: Game)
	{
		ctx.fillStyle = "#000000";
		ctx.font = "10pt helvetica";
		ctx.textAlign = "left";
		ctx.fillText("Virus: " + game.virus, 0, game.ty*this.blocksize + 20);
		ctx.fillText("Wins: " + wins[game.index], 150, game.ty*this.blocksize + 20);
		ctx.fillText("Next: ", 45, -10);
		ctx.save();
		ctx.translate(this.blocksize * (Math.floor(game.tx/2) - 1), -25);
		this.draw_block(0, 0, colors[blocks[game.blocks_index]], 2);
		this.draw_block(1, 0, colors[blocks[game.blocks_index + 1]], 4);
		ctx.restore();
	}

	public display_messages(game: Game)
	{
		if (game.messages.length !== 0){
			ctx.fillStyle = '#000000';
			ctx.font = "20pt helvetica";
			ctx.textAlign = "center";
			ctx.fillText(game.messages.shift(), 100, 100);
		}
	}


	public draw_block(i, j, color, neighbor)
	{
		var halfsize = this.blocksize / 2;
		this.ctx.fillStyle = color;
		this.ctx.beginPath();
		this.ctx.save();
		this.ctx.translate((i + 1/2) * this.blocksize, (j + 1/2) * this.blocksize);
		this.ctx.scale(halfsize,halfsize);
		if (neighbor && neighbor !== 0){
			this.ctx.rotate((+neighbor - 1)*Math.PI*2/4);
			this.draw_path(this.hpill);
		} else {
			this.draw_path(this.pill);
		}
		this.ctx.fill();
		this.ctx.restore();
	}

	public draw_virus(i, j)
	{
		var arcsize = this.blocksize / 9;
		this.ctx.save();
		this.ctx.translate((i + 1/2) * this.blocksize, (j + 1/2) * this.blocksize);
		//this.ctx.scale(blocksize, blocksize);
		this.ctx.strokeStyle = '#000000';
		this.ctx.fillStyle = '#000000';
		this.ctx.beginPath();
		this.ctx.arc(3,-1,arcsize,0, Math.PI*2, true);
		this.ctx.fill();
		this.ctx.beginPath();
		this.ctx.arc(-3,-1,arcsize,0, Math.PI*2, true);
		this.ctx.fill();
		this.ctx.beginPath();
		this.ctx.arc(0,6,arcsize,0, Math.PI, true);
		this.ctx.fill();
		this.ctx.restore();
	}

	private draw_path(P)
	{
		var i, l=P.length;
		this.ctx.beginPath();
		this.ctx.moveTo(P[0][0],P[0][1]);
		for (i = 1; i < l; i++){
			this.ctx.lineTo(P[i][0],P[i][1]);
		} 
		this.ctx.lineTo(P[0][0],P[0][1]);
	}
}


//Matrix operations

function copy(a){
	var n = [], i, j;
	for (i = 0; i < a.length; i++){
		n[i] = [];
		for (j = 0; j < a[0].length; j++){
			n[i][j] = a[i][j];
		}
	}
	return n;
}

function eq(a,b){
	var i, j;
	for (i = 0; i < a.length; i++){
		for (j = 0; j < a[0].length; j++){
			if (a[i][j] !== b[i][j]){
				return false;
			}
		}
	}
	return true;
}

function flip2by2(a){
	var t = a[0][0];
	a[0][0] = a[0][1];
	a[0][1] = a[1][1];
	a[1][1] = a[1][0];
	a[1][0] = t; 
}



class Game
{
	public x;
	public y;
	public tx;
	public ty;
	public index;
	public speed;
	public state = [];
	public initial = [];
	public neighbors = []; // 0 - no neighbor, u,r,d,l = 1,2,3,4
	public ticks = 0;
	public blocks_index = 0;
	public live = false;
	public falling = [];
	public punish_list = [];
	public lines_in_this_move= [];
	public messages = [];
	public virus = 0;
	public level = 10;

	private view;
	public movable;
	private dead = false;
	private markedtime;


	constructor(x, y, speed, level=10, index=0)
	{
		this.index = index;
		this.x = x;
		this.y = y; 
		this.speed = speed;
		this.init_state(level);
		this.view = new CanvasView(ctx, this);
		this.tx = x;
		this.ty = y;
		this.level = level;
	}

	public clone():Game
	{
		var newGame = new Game(this.x, this.y, this.speed, this.level);
		newGame.state = copy(this.state);
		newGame.initial = copy(this.initial);
		newGame.virus = this.virus; + 1 
		return newGame;
	}

	public init_state(level)
	{
		var i, j, n;
		this.virus = 0;
		for (i = 0; i < this.x; i++){
			this.state[i] = [];
			this.initial[i] = [];
			this.neighbors[i] = [];
			for (j = 0 ; j < this.y ; j++){
				this.neighbors[i][j] = 0; 
				if (j < this.y - level || this.line_test(i,j)){
					this.state[i][j] = this.initial[i][j] = 0;
				} else {
					this.state[i][j] = Math.floor(Math.random()*(colors.length + 1));
					if (this.state[i][j] >= colors.length){
						this.state[i][j] = 0; 
					}
					if (this.state[i][j] !== 0){
						this.initial[i][j] = 1;
						this.virus += 1;
					} else {
						this.initial[i][j] = 0;
					}
				}
			}
		}
	}


	public flip()
	{
		var t, obj = this.movable, a = copy(obj.a);
		flip2by2(a);
		if (!this.collision(a, obj.x, obj.y)){
			obj.a = a;
			obj.neighbors = (obj.neighbors + 1)%4;
		}
	}



	public line_test(ist, jst)
	{
		var col, i = ist, j = jst-1;
		if (j >= 0 && this.state[i][j] !== 0){ 
			while (j > 0 && this.state[i][j] === this.state[i][j-1] ){
				j -= 1;
			}
			if (jst - j > 2){
				return true;
			}
		}
		i = ist - 1; j = jst;
		if (i >= 0 && this.state[i][j] !== 0){
			while (i > 0 && this.state[i][j] === this.state[i-1][j]){
				i -= 1;
			}
			if (ist - i > 2){
				return true;
			}
		}
		return false;
	}




	public tick()
	{
		var i, obj, to_be_removed = [];
		for (i = 0; i < this.falling.length; i++){
			obj = this.falling[i];
			if ((this.ticks % obj.speed) === 0){
				if(this.dropdown(obj)){
					to_be_removed.push(i); 
				}
			}
		}
		for (i = to_be_removed.length - 1; i >= 0; i--){
			this.falling.splice(to_be_removed[i],1);
		}
		if (this.markedtime && this.ticks - this.markedtime > 20){
			this.delmarked();
			this.markedtime = undefined;
			this.orphans();
		}
		if (!this.markedtime && this.falling.length === 0){
			if (this.punish_list.length !== 0){
				this.next_punish();
			} else {
				if (this.lines_in_this_move.length > 1){
//					this.set_punish(this.lines_in_this_move); 
				}
				this.new_movable();
			}
		}
		if ( this.dead ) {
			return 'gameover';
//			this.game_over();
		}
		if ( this.virus == 0 ){
			return 'victory';
//			this.victory();
		}
		this.ticks += 1;
		return '';
	}

	public next_punish()
	{
		var L = this.punish_list.splice(0,1)[0], pos, o, i;
		switch (L.length){
			case 2: o = 4; break;
			case 3: o = 2; break;
			case 4: o = 2; break;
			case 5: o = 2; break;
			default: o = 0; break;
		}
		pos = Math.floor(Math.random()*(this.x - (o*(L.length-1) + 1)));
		for (i = 0; i < L.length; i++){
			this.falling.push(new Block(pos,-1,this.speed,[[L[i]]]));
			pos += o;
		}
	}

	public new_movable()
	{
		this.movable = new Block(Math.floor(this.x/2) - 1, -1, this.speed, [[0,blocks[this.blocks_index]],[0,blocks[this.blocks_index+1]]]);
		this.blocks_index += 2;
		this.falling.push(this.movable);
		this.lines_in_this_move = [];
	}

	public collision(a, x, y)
	{
		var i,j;
		for (i = 0; i < a.length; i++){
			for (j = 0; j < a[0].length; j++){
				if (y + j < 0){
					continue;
				}
				if ((a[i][j] !== 0 && this.state[x + i][y + j] !== 0) || ( y + j >= this.y)){
					return true;
				}
			}
		}
		return false;
	}


	public copy(obj)
	{
		var i,j, a = obj.a, x = obj.x, y = obj.y, newones = [];
		for (i = 0; i < a.length; i++){
			for (j = 0; j < a[0].length; j++){
				if (a[i][j] === 0){
					continue;
				}
				if (j + y === 0){
					this.dead = true;
					return [];
				}
				this.state[i + x][j + y] = a[i][j]; 
				if (obj.neighbors !== undefined){
					this.neighbors[i + x][j + y] = N[obj.neighbors][i][j]; 
				}
				newones.push([i + x, j + y]);
			}
		}
		return newones;    
	}

	public mark_for_deletion(i,j)
	{
		this.state[i][j] = -1;
		if (this.neighbors[i][j] !== 0){
			var n = this.direct(i,j,this.neighbors[i][j]);
			this.neighbors[n[0]][n[1]] = 0;
			this.neighbors[i][j] = 0;
		}
	}

	public mark(ist,jst)
	{
		var k, col = this.state[ist][jst],
		cd = 0, cu = 0, cl = 0, cr = 0, cmarked = [],
		i = ist, j = jst + 1;
		while (j < this.y && this.state[i][j] === col){
			cd += 1;
			j += 1;
		}
		i = ist; j = jst - 1; 
		while (j > -1 && this.state[i][j] === col ){
			cu += 1;
			j -= 1;
		}
		if (cu + cd >= 3 && col !== 0 && col !== -1){
			for (k = -cu; k <= cd; k++){
				this.mark_for_deletion(ist, jst + k);
			}
			cmarked.push(col);
		}
		i = ist + 1; j = jst;
		while (i < this.x && this.state[i][j] === col){
			cr += 1;
			i += 1;
		}
		i = ist - 1; j = jst; 
		while (i > -1 && this.state[i][j] === col){
			cl += 1;
			i -= 1;
		}
		if (cl + cr >= 3 && col !== 0 && col !== -1){
			for (k = -cl; k <= cr; k++){
				this.mark_for_deletion(ist + k, jst);
			}
			cmarked.push(col);
		}
		this.lines_in_this_move.push.apply(this.lines_in_this_move ,cmarked);
		return cmarked.length !== 0;
	}

	public start_fastdrop()
	{
		if (this.movable && !this.movable.fast_drop){
			this.movable.speed = 1;
			this.movable.fast_drop = true;
		}
	}

	public orphans()
	{
		var i, j, n, y, x, new_block;
		for (i = 0; i < this.x; i++){
			for (j = this.y - 1; j >= 0 ; j--){
				if (this.initial[i][j] === 1 || this.state[i][j] === 0 || this.state[i][j] === -1){
					continue;
				}
				if (this.neighbors[i][j] === 0){
					if( this.state[i][j+1] === 0){
						this.falling.push(new Block(i,j,this.speed,[[this.state[i][j]]]));
						this.state[i][j] = 0;
					}
				} else {
					n = this.direct(i,j,this.neighbors[i][j]);
					if (n[0] === i){
						y = n[1] > j ? n[1] : j;
						if (this.state[i][y+1] === 0){
							new_block = new Block(i,y-1,this.speed,[[this.state[i][y-1],this.state[i][y]],[0,0]]);
							new_block.neighbors = 1;  
							this.falling.push(new_block);
							this.state[i][y] = 0;
							this.state[i][y-1] = 0;
						}
					} else {
						x = n[0] < i? n[0] : i;
						if (this.state[x][j+1] === 0 && this.state[x+1][j+1] === 0){
							new_block = new Block(x,j,this.speed,[[this.state[x][j],0],[this.state[x+1][j],0]]);
							new_block.neighbors = 2; 
							this.falling.push(new_block);
							this.state[x][j] = 0;
							this.state[x+1][j] = 0;
						}
					}
				} 
			}
		}
	}

	public delmarked()
	{
		var i, j, x, y, n;
		for (i = 0; i < this.x; i++){
			for (j = 0; j < this.y; j++){
				if (this.state[i][j] === -1){
					this.state[i][j] = 0;
					if (this.initial[i][j] === 1){
						this.initial[i][j] = 0;
						this.virus -= 1;
					}
				}
			}
		}
	}

	public dropdown(obj)
	{
		var newones, that = this;
		if (!this.collision(obj.a, obj.x, obj.y + 1)){
			obj.y += 1;
			return false;
		} else {
			if (this.movable === obj){
				this.movable = undefined;
			}
			newones = this.copy(obj);
			newones = newones.map( function(a){
				return that.mark(a[0],a[1]);
			});
			if (this.onetrue(newones)){
			   this.markedtime = this.ticks;  
			}
			return true;
		}
	}

	public move(dir)
	{
		var i, j, x, y, pos, obj, good, a;
		if (this.movable){
			obj = this.movable;
			a = obj.a;
		} else {
			return;
		} 
		dir = dir === 'right'? 1 : -1;
		good = true;
		for (i = 0; i < a.length; i++){
			for (j = 0; j < a[0].length; j++){
				if (a[i][j] === 0){
					continue;
				}
				x = obj.x + i + dir;
				y = obj.y + j;
				if (x < 0 || x >= this.x || this.state[x][y] !== 0 ){
					good = false;
					break;
				} 
			}
		}
		if (good){
			obj.x += dir;
		} 
	}


	public add_message(text)
	{
		this.messages.push(text);
	}



	public get_punish(colors_list)
	{
		this.punish_list.push(colors_list); 
	}

	public set_punish(colors_list)
	{
		/*
		var i; 
		if (games.length === 1){
			return;
		}
		// hack this should be somewhere else
		if (this.index === undefined){
			this.index = games.indexOf(this);
		}
		i = this.index;
		var game_to = games[(i+1)%2];
		game_to.get_punish(colors_list);
		*/
	}


	private onetrue(l)
	{
		var i = 0;
		while (i < l.length){
			if (l[i]){
				return true;
			}
			i += 1;
		}
		return false;
	}

	private direct(x,y,n)
	{
		switch(n){
			case 0: return [x,y];
			case 1: return [x,y-1];
			case 2: return [x+1,y];
			case 3: return [x,y+1];
			case 4: return [x-1,y];
		}
	}

}


class BotGame extends Game
{
	constructor(x, y, speed, level, index, public bot: Bot)
	{
		super(x, y, speed, level, index);
		bot.game = this;
	}

	public tick()
	{
		var result = super.tick();
		this.bot.tick();
		return result;
	}
}


class MainGame
{
	public games = [];

	constructor()
	{
		this.runframe = <any>this.runframe.bind(this);
	}

	public runframe()
	{
		var result;
		// Calculate state
		for (var index=0; index<this.games.length; index++) {
			var game = this.games[index];
//		games.forEach(function(game,index){
			result = game.tick();
			if (result=='gameover') {
				this.victory((index+1)%2);
			} else if (result=='victory') {
				this.victory(index);
			}
		}
		this.draw();
	}

	public draw()
	{
		ctx.clearRect(0,0,500,600);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0,0,500,600);
		// Draw results
		this.games.forEach(function(game,index){
			ctx.save();
			ctx.translate(30 + index * 240, 30);
			game.view.draw();
			ctx.restore();
		});		
	}

/*	public game_over()
	{
		var i = this.index, 
		other = (i + 1) % 2;
		stop();
		display_text(i, 'You lose');
		if (games.length > 1){
			display_text(other, 'You win');
			wins[other] += 1;
		}
		init();
	}
*/
	public victory(winner: number)
	{
		var loser = (winner + 1) % 2;
		this.stop();
		this.display_text(winner, 'You win');
		if (this.games.length > 1){
			this.display_text(loser, 'You lose');
		}
		wins[winner] += 1;
		this.init();
	}

	public init;

	public start()
	{
//		interval = setInterval(() => { this.runframe; },1000/FPS);
		interval = setInterval(this.runframe, 1000/FPS);
	}

	public stop()
	{
		clearInterval(interval);
		interval = undefined;
	}

	public display_text(game, text)
	{
		var i;
		if (game === 'all'){
			for (i = 0 ; i < this.games.length; i++){
				this.games[i].add_message(text);
			}
		} else {
			this.games[game].add_message(text);
		}
	}

	public pause()
	{
		if (interval){
			this.stop();
			this.display_text('all', 'GAME PAUSED');
			this.draw();
			interval = undefined;
		} else {
			this.start();
		}
	}


	public copy_game_state(game_from, game_to)
	{
		game_to.state = copy(game_from.state);
		game_to.initial = copy(game_from.initial);
		game_to.virus = game_from.virus; + 1 
	}

	public two_p_init(speed, level)
	{
		var i;
		var g1 = new Game(10, 16, speed || 8, level || 10, 0);
		this.games = [
			g1,
			g1.clone()
		];
//		this.copy_game_state(games[0],games[1]);
		this.init_blocks();
	}


	public single_init(speed, level)
	{
		var i;
		this.games = [
			new Game(10, 16, speed || 8, level || 10, 0)
		];
		this.init_blocks();
	}

	public single_with_bot_init(speed=8, level=10)
	{
		var bot = new Bot(better_algo);
		var botgame = new BotGame(10, 16, speed, level, 0, bot);
		this.games = [
			botgame,
			botgame.clone()
		];
		this.init_blocks();
	}

	public single_bot_init(speed=8, level=10)
	{
		var bot = new Bot(better_algo);
		this.games = [
			new BotGame(10, 16, speed, level, 0, bot)
		];
		this.init_blocks();
	}


	public init_blocks()
	{
		for (var i = 0; i < 10000; i++){
			blocks.push(1 + Math.floor(Math.random()*COLORS));
		} 
	}

}




// AI code
class Bot
{
	public game: Game;

	public goal;
	public movable;
	public botspeed;
	public fast_drop = true;

	constructor(public algo, botspeed=5)
	{
		this.botspeed = botspeed;
	}

	public tick()
	{
		var t;
		// if there is movable and no goal or if there is a movable but the bot's movable is old
		if (this.game.movable && (!this.goal || this.movable !== this.game.movable) ){
			t = this.algo(this.game.state, this.game.movable.a);
			this.goal = {pos: t[0], state: t[1]};
			this.movable = this.game.movable;
		} 
		if(this.game.ticks % this.botspeed === 0){
			this.chase_goal();
		}
	}

	public chase_goal() {
		if (!this.game.movable){
			return;
		}
		if (!eq(this.goal.state, this.game.movable.a)){
			this.game.flip();
			return;
		} 
		if (this.goal.pos < this.game.movable.x){
			this.game.move('left');
			return;
		} 
		if (this.goal.pos > this.game.movable.x){
			this.game.move('right');
			return;
		} 
		if (!this.fast_drop){
			this.game.start_fastdrop();
			return;
		}
	};


}


//input state & falling state, output: desired position and rotation
function random_algo(state, drop_state){
	var x = state.length, y = state[0].length, new_state = copy(drop_state), i, l;
	for (i = 0, l = Math.random()*2; i < l; i++){
		flip2by2(new_state);
	} 
	return <any[]>[Math.floor(Math.random()*x), new_state];
}

function better_algo(state, drop_state){
	var stateinfo = analyze_state(state),
	top_color = stateinfo.tops,
	heights = stateinfo.heights, 
	colors = get_drop_colors(drop_state), 
	x = 0;
	x = pair_in_list(colors, stateinfo);
	if (x !== -1){
		return set_drop_state(x, drop_state, colors, 'flat');
	}
	colors = [colors[1],colors[0]];
	x = pair_in_list(colors, stateinfo);
	if (x !== -1){
		return set_drop_state(x, drop_state, colors, 'flat');
	}
	if (colors[0] === colors[1]){
		// add check for double below
	}
	x = single_in_list(colors[1],stateinfo);
	if (x !== -1){
		return set_drop_state(x, drop_state, [colors[0],colors[1]], 'down');
	}
	x = single_in_list(colors[0],stateinfo);
	if (x !== -1){
		return set_drop_state(x, drop_state, [colors[1],colors[0]], 'down');
	}
	//return random_algo(state, drop_state); 
	return set_drop_state(max(stateinfo.heights).max_index, drop_state, [colors[1],colors[0]], 'down');
}

//assume possitive L
function max(L){
	var l = L.length, i, best = -1, besti = 0;
	for (i = 0; i < l; i++){
		if (L[i] > best){
			best = L[i];
			besti = i;
		} 
	}
	return {max: best, max_index: besti};
}

function pair_in_list(p, stateinfo){
	var i, s, l = stateinfo.tops.length, offset = Math.floor(l/2);
	for (i = 0; i < l - 1; i++){
		s = (i + offset ) % l;
		if (p[0] === stateinfo.tops[s] && p[1] === stateinfo.tops[s+1] && stateinfo.heights[s] > 3 && stateinfo.heights[s+1] > 3){
			return s;
		} 
	}
	return -1;
}

function single_in_list(c, stateinfo){
	var i, s, l = stateinfo.tops.length, offset = Math.floor(l/4), besth = 0, x = -1;
	for (i = 0; i < l ; i++){
		s = (i + offset ) % l;
		if (c === stateinfo.tops[s] && stateinfo.heights[s] > besth){
			x = s;
			besth = stateinfo.heights[s];
		} 
	}
	return x;
}

function analyze_state(state){
	var i, tops = [], heights = [], t;
	for (i = 0; i < state.length; i++){
		t = 0;
		while (t < state[i].length && state[i][t] === 0){
			t++;
		}
		tops.push(state[i][t]);
		heights.push(t);
	} 
	return {tops: tops, heights: heights};
}

function get_drop_colors(drop_state){
	var n = [], i, j, a = drop_state;
	for (i = 0; i < a.length; i++){
		for (j = 0; j < a[0].length; j++){
			if (a[i][j] !== 0){
				n.push(a[i][j]);
			}
		}
	}
	return n; 
}

function inList(a, L, eq){
	var i;
	for (i = 0 ; i < L.length; i++){
		if (eq(L[i],a)){
			return true;
		}
	}
	return false;
}

function set_drop_state(goalx, current_state, colors, orientation){
	//console.log('goal ',goalx, ' ', orientation);
	var i, possible_states = [], a = copy(current_state), goal ;
	for (i = 0; i < 4; i++){
		possible_states.push(a);
		a = copy(a);
		flip2by2(a); 
	}
	if (orientation === 'down'){
		goal = [[colors[0],colors[1]],[0,0]];
		if (inList(goal,possible_states, eq)){
			return [goalx, goal];
		}
		goal = [[0,0],[colors[0],colors[1]]];
		if (inList(goal,possible_states, eq)){
			return [goalx - 1, goal];
		}
	}
	if (orientation === 'flat'){
		goal = [[colors[0],0],[colors[1],0]];
		if (inList(goal,possible_states, eq)){
			return [goalx, goal];
		}
		goal = [[0,colors[0]],[0,colors[1]]];
		if (inList(goal,possible_states, eq)){
			return [goalx, goal];
		}
	}
	//alert('error impossible state');
}
//init = single_init;
//init();
//start();
//pause();

//}())


/*
window.addEventListener('keypress', function (e) {
	var s = String.fromCharCode(e.which);   
	if (e.which === 32){
		pause();
	}
	if (s === 'p'){
		pause();
	}
	var game = (init === two_p_init || init === single_with_bot_init)? 1 : 0;
	if (s === '4' || s === 'j'){
	   games[game].move('left');
	}
	if (s === '6' || s === 'l'){
	   games[game].move('right');
	}
	if (s === '5' || s === 'k'){
	   games[game].start_fastdrop();
	}
	if (s === '8' || s === 'i'){
	   games[game].flip();
	}
	if (init === two_p_init){
		if (s === 'a'){
		   games[0].move('left');
		}
		if (s === 'd'){
		   games[0].move('right');
		}
		if (s === 's'){
		   games[0].start_fastdrop();
		}
		if (s === 'w'){
		   games[0].flip();
		}
	}
	if (s === '-'){
		stop();
		init = single_with_bot_init;
		init();
		start();
	}
	if (s === '='){
		stop();
		init = two_p_init;
		init();
		start();
	}
	if (s === '['){
		stop();
		init = single_init;
		init();
		start();
	}
	// DEBUGGING
//    if (String.fromCharCode(e.charCode) === '1'){
//       games[0].movable.speed = 10000;
//    }
//    if (String.fromCharCode(e.charCode) === '2'){
//       games[1].movable.speed = 10000;
//    }
//    if (String.fromCharCode(e.charCode) === '3'){
//        punish(games[0],[2,1]);
//    }
//    if (String.fromCharCode(e.charCode) === '4'){
//        single_init(1);
//        games[0].falling.push(new Block(4, 2,games[0].speed,[[1]]));
//        games[0].falling.push(new Block(4, 1,games[0].speed,[[1]]));
//        games[0].falling.push(new Block(4, 0,games[0].speed,[[1]]));
//        games[0].falling.push(new Block(4,-1,games[0].speed,[[1]]));
//    }
//
	e.preventDefault();
}, false);
*/


var app = new MainGame();


//init = app.single_bot_init;
//init(5);
app.single_bot_init(5);
app.start();
