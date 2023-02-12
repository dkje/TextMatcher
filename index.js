const setObserver = (targetDom, eventHandler) => {
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((records) => {
			records.addedNodes.forEach(eventHandler);
		});
	});
	observer.observe(targetDom, {
		childList: true,
		subtree: true,
		attributes: false,
		characterData: false,
	});
};

let storage = chrome.storage;
const getItems = async () => {
	let { items } = (await storage.sync.get("items")) || { items: [] };
	if (!Array.isArray(items)) {
		return [];
	}
	return items;
};

const checkRegex = async (targetNode) => {
	const items = await getItems();
	if (!items.length) return;
	const matchText = items.map(({ value }) => value).join("|");
	const findRegex = new RegExp(matchText);

	const getMatchedDoms = (node, matchedDoms = []) => {
		const matched = node.innerText?.match(findRegex);
		if (!matched) return matchedDoms;

		if (matched && node.nodeName === "SPAN") {
			matchedDoms.push(node);
		}
		node.childNodes?.forEach(
			(n) => (matchedDoms = getMatchedDoms(n, matchedDoms))
		);

		return matchedDoms;
	};

	const matchedDoms = getMatchedDoms(targetNode);

	if (matchedDoms.length) {
		console.log("========================================");
		console.log("Matched Text Log 아래의 돔을 확인하세요");
		matchedDoms.forEach((el) => console.log(el));
	}
};

const init = async () => {
	setObserver(document.body, checkRegex);
};

init();

console.log("~~ text matcher run ~~");
