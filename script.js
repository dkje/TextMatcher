const getLiItem = ({ innerText, closeEventHandler }) => {
	const $li = document.createElement("li");
	$li.innerText = innerText;
	const $removeLiBtn = document.createElement("button");
	$removeLiBtn.innerText = "x";
	$removeLiBtn.className = "btn_sm";
	$removeLiBtn.addEventListener("click", closeEventHandler);
	$li.appendChild($removeLiBtn);
	return $li;
};

const getNoItemMsg = (text) => {
	const $message = document.createElement("span");
	$message.className = "info_text";
	$message.innerText = text;
	return $message;
};

const initTextListListener = () => {
	let storage = chrome.storage;

	const loadList = async () => {
		const items = await getItems();
		const $list = document.getElementById("saved_list");
		$list.innerHTML = "";

		if (items.length) {
			const getItem = ({ value, id }) => {
				return getLiItem({
					innerText: value,
					closeEventHandler: () => removeItem(id),
				});
			};
			$list.append(...items.map(getItem));
		} else {
			$list.appendChild(getNoItemMsg("no settings saved"));
		}
	};

	const getItems = async () => {
		let { items } = (await storage.sync.get("items")) || { items: [] };
		if (!Array.isArray(items)) {
			return [];
		}
		return items;
	};

	const clearItemAll = () => {
		storage.sync.set({ items: [] });
	};

	const saveItem = async ({ newRegex }) => {
		if (!newRegex) {
			alert("Please enter a value to save");
			return;
		}

		const items = await getItems();
		const alreadyAdded = items.some((el) => {
			return el.value === newRegex;
		});

		if (alreadyAdded) {
			alert("Replace Target already saved.");
			return;
		}

		items.push({ value: newRegex, id: Date.now() });
		storage.sync.set({ items });
		return true;
	};

	const removeItem = async (removeId) => {
		let items = await getItems();
		items = items.filter(({ id }) => id !== removeId);
		storage.sync.set({ items });
	};

	const addBtnEventHandler = () => {
		const $addBtn = document.getElementById("add_btn");
		$addBtn.addEventListener("click", async (e) => {
			e.stopPropagation();
			const $new_regex = document.getElementById("new_regex");
			const ok = await saveItem({
				newRegex: $new_regex.value,
			});
			if (ok) {
				$new_regex.value = "";
			}
		});

		const $removeAllBtn = document.getElementById("remove_all_btn");
		$removeAllBtn.addEventListener("click", () => {
			clearItemAll();
		});
	};

	const addStorageEventHandler = () => {
		storage.onChanged.addListener(loadList);
	};

	const init = () => {
		addBtnEventHandler();
		addStorageEventHandler();
		loadList();
	};

	init();
};

initTextListListener();
