// Setting an injection flag in order to avoid repeated injections from background.js
window.__GITHUB_FILE_DOWNLOADER_EXTENSION_LOADED__ = true;

// Tracking injection state, attempts to run an injection, and last URL
let isButtonInjected = false;
let lastUrl = window.location.href;
let injectionAttempt = 0;
const MAX_ATTEMPTS = 10;

// Regex to avoid injection on pages for individual files
const urlRegex = /\/blob\//i;

// Selector of the element that displays data about files and folders
const fileTableElementSelector = '[aria-labelledby="folders-and-files"]';

// Function to save/delete selected files to/from local storage
function handleFileSelection(el) {
    const element = el.target;

    if (!element.classList.contains("github-ext-file-selection-checkbox")) {
        return
    }

    const localStorageItem = window.localStorage.getItem("github-ext-downloader-files") || "[]"; // Default to empty array
    const parsedArray = JSON.parse(localStorageItem);

    const fileLink = element.getAttribute("data-github-ext-direct-download-link");

    const contextMenuFinishSelectionButton = document.querySelector(".github-ext-finish-selection-button");

    // Deciding what to do next based on whether the checkbox was checked or unchecked
    if (element.checked) {
        // Adding the link to the array
        if (parsedArray.length == 0) {
            contextMenuFinishSelectionButton.classList.add("appear");        
        }

        parsedArray.push(fileLink);
    } else {
        // Finding the specified link in the array
        const savedLink = parsedArray.indexOf(fileLink);
        // Removing it
        parsedArray.splice(savedLink);
        
        if (parsedArray.length == 0) {
            contextMenuFinishSelectionButton.classList.remove("appear");         
        }
    }

    // Preparing the result for saving in the local storage
    const stringifiedArray = JSON.stringify(parsedArray);
    // Rewriting the existing local storage item
    window.localStorage.setItem("github-ext-downloader-files", stringifiedArray);
}

// Function to create elements with specified attributes
function createNewElementWithAttributes(tag, attributes = {}) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes)) {
        if (key === "className") {
            // Don't want to remove all previous styles
            element.classList.add(value);
            continue;
        }

        element.setAttribute(key, value)
    }

    return element;
}

// Function for rendering a loading spinner
function showLoadingSpinner() {
    // Creating modal container and essential elements  
    const modalContainer = createNewElementWithAttributes("div", { id: "github-ext-info-modal-container" });
    const modalElement = createNewElementWithAttributes("div", { id: "github-ext-info-modal" });
    const modalHeading = createNewElementWithAttributes("h2", { id: "github-ext-info-modal-heading"} );

    modalHeading.textContent = "Downloading...";

    const loadingSpinnerContainer = createNewElementWithAttributes("div", { id: "github-ext-loading-spinner-container" });
    const spinnerElement = createNewElementWithAttributes("div", { id: "github-ext-loading-spinner" });

    loadingSpinnerContainer.appendChild(spinnerElement);

    appendChildren(modalElement, [modalHeading, loadingSpinnerContainer]);

    modalContainer.appendChild(modalElement)

    document.body.appendChild(modalContainer);

    document.body.style.overflow = "hidden";
}

// Function for rendering an error/success modal
function showModal(type, message) {
    const modalElement = document.getElementById("github-ext-info-modal");

    const loadingSpinnerContainer = modalElement.querySelector("#github-ext-loading-spinner-container");
    loadingSpinnerContainer?.remove();

    const modalHeading = modalElement.querySelector("#github-ext-info-modal-heading");
    
    modalHeading.textContent = type == "error" ? "Error" : "Completed";

    let modalMessage = modalElement.querySelector("#github-ext-info-modal-message");

    if (!modalMessage) {
        modalMessage = createNewElementWithAttributes("p", { id: "github-ext-info-modal-message" });
        modalElement.appendChild(modalMessage);
    }

    modalMessage.innerHTML = message;

    let modalButton = document.getElementById("github-ext-info-modal-button");

    if (!modalButton) {
        modalButton = createNewElementWithAttributes("button", { id: "github-ext-info-modal-button" });
        modalButton.textContent = "Close";
        modalButton.addEventListener("click", closeModal);

        modalElement.appendChild(modalButton);
    }
}

// Function that returns links to files selected by the user
function handleSelectionDownload() {
    const localStorageItem = window.localStorage.getItem("github-ext-downloader-files") || "[]"; // Default to empty array
    const linksArray = JSON.parse(localStorageItem);

    return linksArray
}

// Function that returns links to all files on the page
function handleBulkDownload() {
    const extractedData = extractAllFilesData("link");
    const linksArray = extractedData.links;

    return linksArray
}

// Closing the modal by removing it from the DOM
function closeModal() {
    const modalContainer = document.body.querySelector("#github-ext-info-modal-container");
    const modalButton = document.body.querySelector("#github-ext-info-modal-button");

    document.body.style.overflow = "initial";

    modalButton.removeEventListener("click", closeModal);
    modalContainer.remove();
}

function removeClassesFromElements(selector, className) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.remove(className));
}

// Deleting checkboxes and everything related to file selection
function resetSelectionMenu() {
    // Changing visibility of selection menu elements
    removeClassesFromElements(".github-ext-finish-selection-button", "appear");
    removeClassesFromElements(".github-ext-context-menu-button", "vanish");

    // Removing all checkboxes
    const checkBoxElContainer = document.querySelectorAll(".github-ext-checkbox-container");
    checkBoxElContainer.forEach(cont => cont.remove());

    // Removing certain rules from GH's original container
    removeClassesFromElements(".github-ext-checkbox-injection-target", "github-ext-checkbox-injection-target");

    deleteSelectionData();

    const checkBoxButton = document.querySelector("#github-ext-download-checkbox");
    checkBoxButton.removeEventListener("change", resetSelectionMenu);
}

// Function to initiate file selection mode
function enableSelection() {
    const extractedData = extractAllFilesData("file");
    const files = extractedData.files;
    const links = extractedData.links;

    const contextMenuButtons = document.querySelectorAll(".github-ext-context-menu-button");
    //contextMenuButtons.forEach(btn => btn.classList.add("github-ext-context-menu-button-vanish"));
    contextMenuButtons.forEach(btn => btn.classList.add("vanish"));

    const checkBoxButton = document.querySelector("#github-ext-download-checkbox");
    checkBoxButton.addEventListener("change", resetSelectionMenu);

    // Creating checkboxes for file selection
    for (let i = 0; i < files.length; i++) {
        const parentOne = files[i].parentElement;
        const parentTwo = parentOne.parentElement;
        const tableRow = parentTwo.parentElement;

        const dateInfoRowContainer = tableRow.querySelector(".react-directory-commit-age");
        dateInfoRowContainer.classList.add("github-ext-checkbox-injection-target");

        const checkBoxElContainer = createNewElementWithAttributes("div", { className: "github-ext-checkbox-container" });

        const checkBoxEl = createNewElementWithAttributes("input", {
            type: "checkbox",
            className: "github-ext-file-selection-checkbox",
            "data-github-ext-direct-download-link": links[i]
        })

        checkBoxElContainer.appendChild(checkBoxEl);

        dateInfoRowContainer.appendChild(checkBoxElContainer);
    }

    const tableEl = document.querySelector(fileTableElementSelector);

    const contextMenuFinishSelectionButton = document.querySelector(".github-ext-finish-selection-button");
    contextMenuFinishSelectionButton.addEventListener("click", initiateDownload)

    tableEl.addEventListener("change", handleFileSelection);
}

function deleteSelectionData() {
    window.localStorage.removeItem("github-ext-downloader-files");
}

// Event listener for cleaning up selected files before leaving the page
window.addEventListener("beforeunload", () => {
    deleteSelectionData();
})

// Function to delay requests for the purpose of avoiding GitHub's rate limits
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to initiate download
async function initiateDownload(e) {
    const callerElement = e.target;
    const downloadType = callerElement.getAttribute("data-github-ext-download-type");

    let linksArray;

    switch (downloadType) {
        case "bulk":
            linksArray = handleBulkDownload();
            break;
        case "selection":
            linksArray = handleSelectionDownload();
            break;
    }

    const zip = new JSZip();
    const filePath = window.location.pathname.split("/");
    filePath.shift();
    const folderName = "github-" + filePath.join("-") || "github_folder";

    showLoadingSpinner();

    for (const link of linksArray) {
        try {
            const resp = await fetch(link);
            if (!resp.ok) throw new Error(`Unable to fetch ${link}..`);

            const content = await resp.blob();
            let fileName = link.split("/").pop();
            zip.file(fileName, content);
            // Small delay to avoid rate-limiting
            await delay(400); 
        } catch (error) {
            console.error(error.message);
        }
    }

    if (downloadType == "selection") {
        resetSelectionMenu();
    } 

    const downloadCheckBoxButton = document.querySelector("#github-ext-download-checkbox");
    downloadCheckBoxButton.checked = false;

    const archivedFilesCount = Object.keys(zip.files).length;
    const filesCount = linksArray.length;

    if (archivedFilesCount == 0) {
        showModal("error", "All downloads failed.");
        return;
    }

    // Completing archive creation and downloading it 
    zip.generateAsync({ type: "blob" }).then((blob) => {
        const zipUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = zipUrl;
        link.download = `${folderName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(zipUrl);
    })

    const modalMessage = archivedFilesCount === filesCount ?  
    `Downloaded a ZIP-archive with <b>${archivedFilesCount}</b> file(s).`:
    `Downloaded <b>${archivedFilesCount}</b> out of ${filesCount} files.`; 

    showModal("success", modalMessage);
}

// Function for creating a download link to a raw file
function getDownloadLink(blobLink) {
    // A regular expression for filtering out information for creating a URL 
    const regex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;
    const match = blobLink.match(regex);
    const [, owner, repo, branch, filePath] = match;
    const finalLink = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    return finalLink;
}

// Function for extracting links from anchor elements
function extractLinks(file) {
    const parent = file.parentElement;
    const linkEl = parent.querySelector("a");
    const downloadLink = getDownloadLink(linkEl.href)
    return downloadLink
}

function selectFileTable() {
  return new Promise((resolve) => {
    const fileTable = document.querySelector(fileTableElementSelector);
    if (fileTable) {
      injectionAttempt = 0;      
      resolve(fileTable);
      return;
    }

    // Set up MutationObserver to watch for the file table
    const observer = new MutationObserver((mutations, obs) => {
      const target = document.querySelector(fileTableElementSelector);
      if (target) {
        injectionAttempt = 0;        
        resolve(target);
        obs.disconnect(); // Stop observing once found
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Timeout to prevent infinite observation
    setTimeout(() => {
      if (injectionAttempt >= MAX_ATTEMPTS) {
        observer.disconnect();
        // Reset the variable for tracking injection attempts if the element was not found after 10 attempts
        injectionAttempt = 0; 
        resolve(false);
      }
      injectionAttempt++;
    }, 300 * MAX_ATTEMPTS);
  });
}

// Function to check whether there are any files to download
function hasDownloadableFiles() {
  return new Promise((resolve) => {
    selectFileTable().then((fileTable) => {
      if (!fileTable) {
        resolve(false);
        return;
      }

      const filesList = fileTable.querySelectorAll(
        '.react-directory-row-name-cell-large-screen > .react-directory-filename-column > .octicon-file'
      );
      resolve(filesList.length > 0);
    });
  });
}

function extractAllFilesData(dataType) {
    // Targetting the primary table so as to avoid selecting wrongs things from the sidebar:
    const fileTable = document.querySelector(fileTableElementSelector);
    // Finding files only by their SVG icons
    const filesList = fileTable.querySelectorAll('.react-directory-row-name-cell-large-screen > .react-directory-filename-column > .octicon-file');

    // Checking if there are any files to download 
    if (filesList.length == 0) {
        return;
    }

    // Creating an array of links by going up to the parent element and selecting a link sibling:
    const resultObject = {
        links: [],
        files: []
    }

    for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        const link = extractLinks(file);
        resultObject.links.push(link);

        if (dataType == "file") {
            resultObject.files.push(file);
        }

    }

    return resultObject
}

// Function to inject the button
function injectButton() {
    // If we are not on the main page of a repo, target #StickyHeader
    const targetElement = document.querySelector("#StickyHeader") || 
    document.querySelector('.Layout-main');

    if (!targetElement) {
        return;
    }

    // Check if the button already exists to avoid duplicates
    const injectedButton = document.querySelector("#github-ext-download-checkbox");
    if (injectedButton) {
        injectedButton.parentElement.remove();
    }

    // Use a DocumentFragment for efficient DOM updates
    const fragment = document.createDocumentFragment();

    // Create the container
    const container = createNewElementWithAttributes("div", { className: "github-ext-download-button-container" });
    // Create the checkbox
    const checkbox = createNewElementWithAttributes("input", {
        type: "checkbox",
        id: "github-ext-download-checkbox",
        className: "github-ext-download-button"
    })

    // Create the context menu
    const contextMenu = createNewElementWithAttributes("div", { className: "github-ext-context-menu" });

    // "All" download button
    const downloadButtonContext = createNewElementWithAttributes("button", { 
        className: "github-ext-context-menu-button",
        "data-github-ext-download-type": "bulk"
    });

    downloadButtonContext.textContent = "All";
    downloadButtonContext.addEventListener("click", initiateDownload);

    // "Select" button
    const enableSelectionButton = createNewElementWithAttributes("button", { 
        className: "github-ext-context-menu-button"
    });

    enableSelectionButton.textContent = "Select";
    enableSelectionButton.addEventListener("click", enableSelection);

    // Complete selection button
    const completeSelectionButton = createNewElementWithAttributes("div", { 
        className: "github-ext-finish-selection-button",
        "data-github-ext-download-type": "selection"
    })
    completeSelectionButton.textContent = "Download";

    // Putting the context menu together
    appendChildren(contextMenu, [downloadButtonContext, enableSelectionButton, completeSelectionButton]);

    // Populating the container
    appendChildren(container, [checkbox, contextMenu]);

    // Add to fragment and inject
    fragment.appendChild(container);

    if (targetElement.getAttribute("id") == "StickyHeader") {
        targetElement.appendChild(fragment);
    } else {
        targetElement.prepend(fragment)
    }

    // Set injection state to true
    isButtonInjected = true;
}

// Function to append multiple children to specific parent in a strict order
function appendChildren(parent, children) {
    children.forEach(child => parent.appendChild(child));
}

function shouldInjectButton() {
    return (
        !isButtonInjected &&
        !urlRegex.test(window.location.href) &&
        document.readyState !== "loading"  
    );
}

// Removing injected button
function removeInjectedButton() {
    const injectedButton = document.querySelector('#github-ext-download-checkbox');
    if (injectedButton) {
        injectedButton.parentElement.remove();
        isButtonInjected = false;
    }
}

// Run injection when page is ready
async function runInjection() {
    // If conditions for injection have not been satisfied, try to remove the button
    if (!shouldInjectButton()) {
        removeInjectedButton();
        return;
    }

    // Checking for downloadable files
    const hasFiles = await hasDownloadableFiles();
    if (hasFiles) {
        injectButton();
    } else {
        removeInjectedButton();
    }
}

runInjection();

// Function to run when a non-standard event is fired on navigation 
function onGitHubNavigation() {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        deleteSelectionData();
        lastUrl = currentUrl;
        isButtonInjected = false;
        runInjection();
    }
}

window.addEventListener("popstate", () => {
  // Delay slightly to wait for DOM updates to be completed
  setTimeout(onGitHubNavigation, 50);
});

document.addEventListener("turbo:load", onGitHubNavigation);
document.addEventListener("soft-nav:end", onGitHubNavigation);
