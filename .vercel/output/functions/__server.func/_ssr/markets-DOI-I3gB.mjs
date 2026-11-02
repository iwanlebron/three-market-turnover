import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/markets-DOI-I3gB.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getBoard_createServerFn_handler = createServerRpc({
	id: "29683542d941668fb8664338613c9ef883904e4eb9649b6267afe9aa3c827ffa",
	name: "getBoard",
	filename: "src/lib/markets.ts"
}, (opts) => getBoard.__executeServer(opts));
var getBoard = createServerFn({ method: "GET" }).validator((input) => {
	return { fresh: typeof input === "object" && input !== null && "fresh" in input && input.fresh === true };
}).handler(getBoard_createServerFn_handler, async ({ data }) => {
	const { loadBoard } = await import("./markets.server-BmEuhY1Z.mjs");
	return loadBoard(data.fresh);
});
//#endregion
export { getBoard_createServerFn_handler };
