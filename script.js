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

const initExportImportSetting = () => {
	const onClickImport = () => {
		const getFileInput = (onSelectFile) => {
			const $input = document.createElement("input");
			$input.type = "file";
			$input.accept = ".json";
			$input.addEventListener("change", onSelectFile);
			return $input;
		};

		const saveWithMerge = async (importedSetting) => {
			const originalSetting = await chrome.storage.sync.get(null);

			const items = [
				...(originalSetting.items || []),
				...(importedSetting.items || []),
			].reduce((acc, cur) => {
				const conflict = acc.some(
					({ removeText }) => cur.removeText === removeText
				);
				if (!conflict) acc.push(cur);
				return acc;
			}, []);

			const matches = [
				...new Set([
					...(originalSetting.matches || []),
					...(importedSetting.matches || []),
				]),
			];
			const avtiveBtnVisible =
				originalSetting.avtiveBtnVisible || importedSetting.avtiveBtnVisible;

			const result = {
				avtiveBtnVisible,
				items,
				matches,
			};

			chrome.storage.sync.set(result);
		};

		const fileHandler = async (e) => {
			const fileToJSON = (file) => {
				const reader = new FileReader();
				reader.onload = () => {
					saveWithMerge(JSON.parse(reader.result));
				};
				reader.readAsText(file);
			};
			const file = await e.target.files[0];
			fileToJSON(file);
		};

		const $input = getFileInput(fileHandler);
		$input.click();
	};

	const onClickExport = async () => {
		const getSettingFile = async () => {
			const settingData = await chrome.storage.sync.get(null);
			const blob = new Blob([JSON.stringify(settingData)], {
				type: "text/json",
			});
			return blob;
		};

		const getLinkDom = (blob, filename) => {
			const link = document.createElement("a");
			link.download = filename;
			link.href = window.URL.createObjectURL(blob);
			link.dataset.downloadurl = ["text/json", link.download, link.href].join(
				":"
			);
			return link;
		};

		const file = await getSettingFile();
		const $link = getLinkDom(file, "text_replacer_setting.json");

		$link.dispatchEvent(
			new MouseEvent("click", {
				view: window,
				bubbles: true,
				cancelable: true,
			})
		);
		$link.remove();
		alert("설정 파일이 다운로드 됐습니다");
	};

	const $exportBtn = document.getElementById("export_btn");
	console.log($exportBtn);
	$exportBtn.addEventListener("click", onClickExport);
	const $import_btn = document.getElementById("import_btn");
	$import_btn.addEventListener("click", onClickImport);
};

initTextListListener();
initExportImportSetting();
