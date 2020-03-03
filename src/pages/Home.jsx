import {
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
	IonButton,
	IonItem,
	IonLabel,
	IonInput,
	IonIcon,
	IonSpinner,
	IonAlert
} from "@ionic/react";
import React, { useState, useEffect, useRef } from "react";
import ExploreContainer from "../components/ExploreContainer";
import { makeStyles } from "@material-ui/core/styles";
import "./Home.css";
import InlineSVG from "svg-inline-react";
import $ from "jquery";
import { Container, Row, Col } from "react-bootstrap";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import IconButton from "@material-ui/core/IconButton";
import { arrowForwardCircle } from "ionicons/icons";

import img from "../resources/background_maze.jpg";

import Canvg, { presets } from "canvg";

import ClojureMazeAPI from "./../utilities/ClojureMazeAPI";

var mousePressed = false;
var lastX, lastY;
var ctx;
const Home = () => {
	const ref = useRef(null);

	const useStyles = makeStyles(theme => ({
		root: {
			display: "flex",
			flexWrap: "wrap",
			justifyContent: "space-around",
			overflow: "hidden",
			backgroundColor: "white"
		},
		gridList: {
			flexWrap: "nowrap",
			// Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
			transform: "translateZ(0)"
		},
		title: {
			color: "white"
		},
		titleBar: {
			background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 100%)",
			outline: "none"
		}
	}));

	const classes = useStyles();

	const [mazeImage, setMazeImage] = useState();
	const [mazeMap, setMazeMap] = useState();
	const [mazeMask, setMazeMask] = useState("");
	const [mazeSize, setMazeSize] = useState(32);
	const [maskSize, setMaskSize] = useState(32);
	const [showGrid, setShowGrid] = useState(false);
	const [solveCoordinates, setSolveCoordinates] = useState([0, 0, 5, 5]);
	const [isPencil, setIsPencil] = useState(true);
	const [existingMazes, setExistingMazes] = useState([]);
	const [currentMazeName, setCurrentMazeName] = useState("None");
	const [showAlert, setShowAlert] = useState(false);

	const renderSvg = async (width, height, svg) => {
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext("2d");
		const v = await Canvg.from(ctx, svg, presets.offscreen());

		// Render only first frame, ignoring animations and mouse.
		await v.render();

		const blob = await canvas.convertToBlob();
		const pngUrl = URL.createObjectURL(blob);

		return pngUrl;
	};

	const getNewMaze = size => {
		ClojureMazeAPI.generateMaze(size).then(res => {
			// let parser = new DOMParser();
			// let xmlDoc = parser.parseFromString(res, "text/xml");
			// console.log(xmlDoc);
			// let svgElement = xmlDoc.innerHTML
			setMazeMap(res.maze);
			renderSvg(750, 750, res.svg).then(png => {
				setMazeImage(png);
				setCurrentMazeName(`New ${mazeSize} x ${mazeSize}`)
			});
		});
	};

	const getNewMaskedMaze = (size, mask, maskSize) => {
		ClojureMazeAPI.generateMaskedMaze(parseInt(size), mask, maskSize).then(res => {
			setMazeMap(res.maze);
			renderSvg(750, 750, res.svg).then(png => {
				setMazeImage(png);
				setCurrentMazeName(`New masked ${mazeSize} x ${mazeSize}`)
			});
		});
	};

	const solveMaze = (maze, coordinates) => {
		if (coordinates[0] !== null && coordinates[1] !== null && coordinates[2] !== null && coordinates[3] !== null &&
			coordinates.filter(c => c >= 0 && c < maze.length).length === 4 &&
			maze[coordinates[0]][coordinates[1]].mask !== 1 && maze[coordinates[2]][coordinates[3]].mask !== 1) {
			ClojureMazeAPI.solveMaze(maze, coordinates[0], coordinates[1], coordinates[2], coordinates[3]).then(res => {
				console.log(res.maze);
				setMazeMap(res.maze);
				renderSvg(750, 750, res.svg).then(png => {
					setMazeImage(png);
				});
			});
		} else {
			setShowAlert(true);
		}
	};

	const showCanvas = () => {
		let body = `<canvas id="myCanvas" width="${maskSize}" height="${maskSize}" style="border:1px solid #d3d3d3; width: ${maskSize *
			8}px; height: ${maskSize * 8}px;">
                  Your browser does not support the HTML5 canvas tag.
			  </canvas>`;

		return <div dangerouslySetInnerHTML={{ __html: body }} />;
	};

	function Draw(x, y, isDown, isPen) {
		if (isDown) {
			// ctx.beginPath();
			// ctx.strokeStyle = "#FF0000";
			// ctx.lineWidth = 1;
			// ctx.lineJoin = "square";
			// ctx.moveTo(lastX, lastY);
			// ctx.lineTo(x, y);
			// ctx.closePath();
			// ctx.stroke();
			var id = ctx.createImageData(1, 1); // only do this once per page
			var d = id.data; // only do this once per page

			if (isPen) {
				d[0] = 255;
				d[1] = 0;
				d[2] = 0;
				d[3] = 255;
			} else {
				d[0] = 0;
				d[1] = 0;
				d[2] = 0;
				d[3] = 0;
			}

			ctx.putImageData(id, x, y);
		}
		lastX = x;
		lastY = y;
	}

	function createGrid(size) {
		var ratioW = Math.floor(ref.current.offsetWidth / size),
			ratioH = Math.floor(ref.current.offsetHeight / size);

		var parent = $("<div />", {
			class: "grid",
			width: ratioW * size,
			height: ratioH * size
		})
			.addClass("grid")
			.appendTo("image-container");

		for (var i = 0; i < ratioH; i++) {
			for (var p = 0; p < ratioW; p++) {
				$("<div />", {
					width: size - 1,
					height: size - 1
				}).appendTo(parent);
			}
		}
		setMazeSize(mazeSize);
	}

	const drawGrid = () => {
		console.log("render");
		var grid = [];

		var ratioW = Math.floor(ref.current.offsetWidth / mazeSize),
			ratioH = Math.floor(ref.current.offsetHeight / mazeSize);

		for (var i = 0; i < ratioH; i++) {
			for (var p = 0; p < ratioW; p++) {
				grid.push(<div style={{ width: 20, height: 20 }}></div>);
			}
		}

		return (
			<div className="grid" style={{ width: ratioW * mazeSize, height: ratioH * mazeSize, top: "10px", left: "10px" }}>
				{grid}
			</div>
		);
	};

	function clearArea() {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}

	const getArray = () => {
		var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
		var imgData = ctx.getImageData(0, 0, maskSize, maskSize);
		return imgData.data.toString();
	};

	const attachDrawEvents = () => {
		$("#myCanvas").mousedown(function (e) {
			mousePressed = true;
			Draw((e.pageX - $(this).offset().left) / 8, (e.pageY - $(this).offset().top) / 8, false, isPencil);
		});

		$("#myCanvas").mousemove(function (e) {
			if (mousePressed) {
				Draw((e.pageX - $(this).offset().left) / 8, (e.pageY - $(this).offset().top) / 8, true, isPencil);
			}
		});
	};

	const attachEvents = () => {
		ctx = document.getElementById("myCanvas").getContext("2d");
		attachDrawEvents();
		$("#myCanvas").mouseup(function (e) {
			mousePressed = false;
		});
		$("#myCanvas").mouseleave(function (e) {
			mousePressed = false;
		});
	};

	useEffect(() => {
		//getNewMaze(mazeSize);

		//Scroll the mazes list horizontally with the mousewheel
		var item = document.getElementById("mazes");

		item.addEventListener("wheel", function (e) {
			if (e.deltaY > 0) item.scrollLeft += 100;
			else item.scrollLeft -= 100;
		});

		ClojureMazeAPI.getAvailableMazes().then(res => {
			Promise.all(
				res.map(dbMaze => {
					return renderSvg(750, 750, dbMaze.svg).then(png => {
						return { ...dbMaze, png: png };
					});
				})
			).then(result => {
				setExistingMazes(result);
			});
		});
	}, []);

	const setCurrentMaze = (index) => {
		setMazeMap(existingMazes[index].json);
		setMazeImage(existingMazes[index].png);
		setCurrentMazeName(existingMazes[index].name)
		setMazeSize(existingMazes[index].size)
	}

	useEffect(() => {
		attachEvents();
	}, [maskSize]);

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Clojure Mazes - Gergo Kekesi</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<IonAlert
					isOpen={showAlert}
					onDidDismiss={() => setShowAlert(false)}
					header={'Invalid Coordinates'}
					message={`The coordinates ${solveCoordinates} cannot be used. Please change them. It's either out of bounds or there is a mask at that location.`}
					buttons={['Ok']}
				/>
				<div className="main-content">
					<Container style={{ backgroundColor: "white", boxShadow: "0px 0px 20px black", padding: "15px" }}>
						<Row>
							<Col lg="12" md="12">
								<IonTitle style={{ textAlign: "left" }} className="ion-no-padding">{"Current maze: " + currentMazeName}</IonTitle>
							</Col>
						</Row>
						<Row>
							<Col lg="6" md="6">
								<div id="image-container" style={{ width: "550px", height: "550px", position: "relative" }} ref={ref}>
									{showGrid && drawGrid()}
									<img
										src={mazeImage}
										style={{
											objectFit: "contain",
											position: "absolute",
											width: "100%",
											height: "100%",
											top: "0px",
											left: "0px"
										}}></img>
								</div>
							</Col>
							<Col lg="3" md="3">
								<Row>
									<Col>
										<IonTitle>Standard maze</IonTitle>
									</Col>
								</Row>
								<Row>
									<Col>
										<IonItem>
											<IonLabel position="floating">Maze size</IonLabel>
											<IonInput
												type="number"
												onIonChange={e => {
													if (e.detail.value === "") {
														setMazeSize("");
													} else if (parseInt(e.detail.value) > 32 || parseInt(e.detail.value) < 0) {
														setMazeSize(32);
													} else {
														setMazeSize(e.detail.value);
													}
												}}></IonInput>
										</IonItem>
									</Col>
								</Row>
								<Row>
									<Col>
										<IonButton
											expand="block"
											onClick={() => {
												setMazeMask("");
												getNewMaze(mazeSize);
											}}>
											Get a new maze
										</IonButton>
									</Col>
								</Row>
								<Row>
									<Col>
										<IonItem>
											<IonLabel position="floating">Solve coordinates:</IonLabel>
											<IonInput
												type="text"
												onIonChange={e => {
													if (e.detail.value === "") {
														setSolveCoordinates([0, 0, 5, 5]);
													} else {
														let splitVals = e.detail.value.split(",", 4);
														setSolveCoordinates(
															splitVals.map(val => {
																return parseInt(val);
															})
														);
														console.log(solveCoordinates);
													}
												}}></IonInput>
										</IonItem>
									</Col>
								</Row>
								<Row>
									<Col>
										<IonButton
											expand="block"
											onClick={() => {
												solveMaze(mazeMap, solveCoordinates);
											}}>
											Solve current maze
										</IonButton>
									</Col>
								</Row>
							</Col>
							<Col lg="3" md="3">
								<Row>
									<Col>
										<IonTitle>Masked maze</IonTitle>
									</Col>
								</Row>
								<Row>
									<Col>{showCanvas()}</Col>
								</Row>
								<Row>
									<Col>
										<IonItem>
											<IonLabel position="floating">Mask size</IonLabel>
											<IonInput
												type="number"
												onIonChange={e => {
													if (e.detail.value === "") {
														setMaskSize(32);
													} else if (parseInt(e.detail.value) > 32 || parseInt(e.detail.value) < 0) {
														setMaskSize(32);
													} else {
														setMaskSize(parseInt(e.detail.value));
													}
												}}></IonInput>
										</IonItem>
									</Col>
								</Row>
								<Row>
									<Col>
										<IonButton
											expand="block"
											onClick={() => {
												getNewMaskedMaze(mazeSize, getArray(), maskSize);
												setMazeMask(getArray());
											}}>
											Get new maze with mask
										</IonButton>
									</Col>
								</Row>
								<Row>
									<Col>
										<IonButton
											expand="block"
											onClick={() => {
												clearArea();
											}}>
											Clear mask
										</IonButton>
									</Col>
								</Row>
								<Row>
									<Col>
										<IonButton
											expand="block"
											onClick={() => {
												setIsPencil(isPencil ? false : true);
												attachDrawEvents();
												console.log(isPencil);
											}}>
											Current Tool: {isPencil ? "Eraser" : "Pencil"}
										</IonButton>
									</Col>
								</Row>
							</Col>
						</Row>
						<Row className="justify-content-space-evenly align-items-center" style={{ height: "50px" }}>
							<Col>
								<IonTitle>Select an existing maze</IonTitle>
							</Col>
						</Row>
						<Row>
							<Col>
								<div className={classes.root}>
									{existingMazes.length === 0 && <div style={{ width: "100%", height: "100%" }}>
										<Container>
											<Row className="justify-content-space-evenly align-items-center">
												<Col>
													<IonSpinner name="lines" />
												</Col>
											</Row>
										</Container>
									</div>}
									<GridList className={classes.gridList} cols={2.25} id="mazes">
										{existingMazes.length > 0 && existingMazes.map((tile, index) => (
											<GridListTile key={index} cols={0.5}>
												<img src={tile.png} alt={tile.title} style={{}} />
												<GridListTileBar
													title={tile.name}
													classes={{
														root: classes.titleBar,
														title: classes.title
													}}
													actionIcon={
														<IconButton aria-label={`star ${tile.title}`} style={{ outline: "none" }} onClick={() => {
															setCurrentMaze(index);
														}}>
															<IonIcon
																icon={arrowForwardCircle}
																style={{ width: "35px", height: "35px", filter: "invert(100%)", outline: "none" }}
															/>
														</IconButton>
													}
												/>
											</GridListTile>
										))}
									</GridList>
								</div>
							</Col>
						</Row>
					</Container>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default Home;
