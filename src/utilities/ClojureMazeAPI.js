import axios from "axios";

var ClojureMazeAPI = {};
ClojureMazeAPI.GENERATOR = {};
ClojureMazeAPI.SOLVER = {};
ClojureMazeAPI.EXISTING_MAZES = {};

ClojureMazeAPI.SERVER = "http://localhost:3000";

ClojureMazeAPI.GENERATOR.GENERATE_MAZE = "/generator/new_maze";
ClojureMazeAPI.GENERATOR.GENERATE_MASKED_MAZE = "/generator/new_masked_maze";
ClojureMazeAPI.SOLVER.SOLVE_MAZE = "/solver/solve_maze";
ClojureMazeAPI.EXISTING_MAZES.AVAILABLE_MAZES = "/existing_mazes/available_mazes";

var instance = axios.create({
	baseURL: ClojureMazeAPI.SERVER,
	timeout: 10000,
	headers: { Accept: "text/plain", "content-type": "text/plain" },
	onDownloadProgress: progressEvent => {
		const dataChunk = progressEvent.currentTarget.response;
		console.log(dataChunk.length);
		// dataChunk contains the data that have been obtained so far (the whole data so far)..
		// So here we do whatever we want with this partial data..
		// In my case I'm storing that on a redux store that is used to
		// render a table, so now, table rows are rendered as soon as
		// they are obtained from the endpoint.
	}
});

ClojureMazeAPI.fetchResultGet = async url => {
	return await instance
		.get(url, {
			"content-type": "text/plain"
		})
		.then(result => {
			return result.data.result;
		});
};

ClojureMazeAPI.fetchResultPost = async (url, data) => {
	return await instance
		.post(
			url,
			{ ...data },
			{
				headers: {
					Accept: "application/json",
					"content-type": "application/json"
				}
			}
		)
		.then(result => {
			console.log(result);
			return result.data.result;
		});
};

ClojureMazeAPI.generateMaze = async size => {
	return ClojureMazeAPI.fetchResultGet(ClojureMazeAPI.GENERATOR.GENERATE_MAZE + "?size=" + size);
};

ClojureMazeAPI.generateMaskedMaze = async (size, mask, maskSize) => {
	return ClojureMazeAPI.fetchResultPost(ClojureMazeAPI.GENERATOR.GENERATE_MASKED_MAZE, {
		size: size,
		mask: mask,
		maskSize: maskSize
	});
};

ClojureMazeAPI.solveMaze = async (maze, start_r, start_c, goal_r, goal_c) => {
	return ClojureMazeAPI.fetchResultPost(ClojureMazeAPI.SOLVER.SOLVE_MAZE, {
		maze: maze,
		"start-row": start_r,
		"start-col": start_c,
		"goal-row": goal_r,
		"goal-col": goal_c
	});
};

ClojureMazeAPI.getAvailableMazes = async => {
	return ClojureMazeAPI.fetchResultGet(ClojureMazeAPI.EXISTING_MAZES.AVAILABLE_MAZES);
};

export default ClojureMazeAPI;
