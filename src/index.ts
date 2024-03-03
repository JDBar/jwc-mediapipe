import Fastify from "fastify";
import FastifyStatic from "@fastify/static";
import Path from "path";
import Process from "process";

/**
 * Configuration for the fastify server.
 */
const FASTIFY_OPTIONS: Fastify.FastifyListenOptions = {
	port: 3000,
	host: "localhost",
};

const SERVER = Fastify();

// Serve files in the public folder
const PUBLIC_ROOT = Path.join(Process.cwd(), "public");
SERVER.register(FastifyStatic, {
	root: PUBLIC_ROOT,
});

// Start the server.
SERVER.listen(FASTIFY_OPTIONS, () => {
	console.log(
		`server is running on http://${FASTIFY_OPTIONS.host}:${FASTIFY_OPTIONS.port}`,
	);
});
