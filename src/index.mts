import Fastify from "fastify";

/**
 * Configuration for the fastify server.
 */
const FASTIFY_OPTIONS: Fastify.FastifyListenOptions = {
	port: 3000,
	host: "localhost",
};

const SERVER = Fastify();

// Define routes. e.g. "/" is the root path of the server.
SERVER.get("/", async () => {
	return "Hello world!";
});

// Start the server.
SERVER.listen(FASTIFY_OPTIONS, () => {
	console.log(
		`server is running on http://${FASTIFY_OPTIONS.host}:${FASTIFY_OPTIONS.port}`,
	);
});
