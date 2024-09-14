const searchBtn = document.getElementById("searchbtn");
const queryInput = document.getElementById("query");
const searchEngineSelect = document.getElementById("search-engine");
const resultsDiv = document.getElementById("results");
const loader = document.getElementById("loader");
const themeToggle = document.getElementById("theme-toggle");
const darkModeLabel = document.querySelector(".toggle-label:first-of-type"); // Dark Mode label
const lightModeLabel = document.querySelector(".toggle-label:last-of-type");
const voiceCommandBtn = document.getElementById("voice-command-btn");
const giphyApiKey = "thSMozZNJ3duKendblBlW33cAn621ywG";
let currentPage = 1;
const resultsPerPage = 10;

function showLoader() {
  loader.style.display = "block";
  loader.classList.remove("animate__fadeOut");
  loader.classList.add("animate__fadeIn");
}

function hideLoader() {
  loader.classList.remove("animate__fadeIn");
  loader.classList.add("animate__fadeOut");
  setTimeout(() => {
    loader.style.display = "none";
  }, 500);
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCI8PrjdaJ-P66JdesBG_ynga2cd1wEoYs";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

window.onload = () => {
  const savedSearch = localStorage.getItem("searchResults");
  if (savedSearch) {
    resultsDiv.innerHTML = savedSearch;
  }
};

searchBtn.addEventListener("click", initiateSearch);
queryInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    initiateSearch();
  }
});

function initiateSearch() {
  const query = queryInput.value.trim();
  if (query) {
    const selectedSearchEngine = searchEngineSelect.value;
    handleSearch(query, selectedSearchEngine);
  }
}

let activeSearchEngine = "";

function handleSearch(query, selectedSearchEngine) {
  showLoader();
  let apiUrl;
  let apiParams;

  if (selectedSearchEngine !== "gemini" && activeSearchEngine !== "gemini") {
    resultsDiv.innerHTML = "";
  }

  activeSearchEngine = selectedSearchEngine;

  switch (selectedSearchEngine) {
    case "google":
      apiUrl = "https://www.googleapis.com/customsearch/v1";
      const googleApiKey = "AIzaSyDuq9ED4qTmY-6i0LQIhd2ZmGxLDRzn5-g";
      const startIndex = (currentPage - 1) * resultsPerPage + 1;

      apiParams = {
        q: query,
        key: googleApiKey,
        cx: "b041ed1b5657d4123",
        start: startIndex,
      };

      fetch(
        `${apiUrl}?q=${apiParams.q}&key=${apiParams.key}&cx=${apiParams.cx}&start=${apiParams.start}`
      )
        .then((response) => response.json())
        .then((data) => {
          displayGoogleResults(data.items);
          hideLoader();
          saveResultsToLocalStorage(resultsDiv.innerHTML);
          displayPaginationControls(
            data.queries.nextPage,
            data.queries.previousPage,
            selectedSearchEngine
          );
        })
        .catch((error) => {
          console.error("Error fetching Google results:", error);
          resultsDiv.innerHTML = "<p>Failed to fetch results from Google.</p>";
        });
      break;

    case "wikipedia":
      apiUrl = "https://en.wikipedia.org/w/api.php";
      apiParams = {
        action: "query",
        list: "search",
        srsearch: query,
        format: "json",
      };

      fetch(
        `${apiUrl}?action=${apiParams.action}&list=${apiParams.list}&srsearch=${apiParams.srsearch}&format=${apiParams.format}&origin=*`
      )
        .then((response) => response.json())
        .then((data) => {
          displayWikipediaResults(data.query.search);
          hideLoader();
          saveResultsToLocalStorage(resultsDiv.innerHTML);
        })
        .catch((error) => {
          console.error("Error fetching Wikipedia results:", error);
          hideLoader();
          resultsDiv.innerHTML =
            "<p>Failed to fetch results from Wikipedia.</p>";
        });
      break;

    case "gemini":
      generateText(query);
      break;

    case "giphy":
      apiUrl = `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${query}&limit=10&offset=0&rating=g&lang=en`;

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          displayGiphyResults(data.data);
          hideLoader();
          saveResultsToLocalStorage(resultsDiv.innerHTML);
        })
        .catch((error) => {
          console.error("Error fetching Giphy results:", error);
          hideLoader();
          resultsDiv.innerHTML = "<p>Failed to fetch results from Giphy.</p>";
        });
      break;
  }
}


async function generateText(prompt) {
  try {
    const result = await model.generateContent(prompt);

    console.log(result);

    const generatedText =
      result.response.candidates[0]?.content?.parts[0]?.text ||
      "No content available";

    const geminiResultDiv = document.createElement("div");
    geminiResultDiv.classList.add("gemini-result");

    const formattedText = generatedText
      .split("\n\n")
      .map((paragraph) => `<p>${paragraph.trim()}</p>`)
      .join("");

    geminiResultDiv.innerHTML = formattedText;

    resultsDiv.innerHTML = "";
    resultsDiv.appendChild(geminiResultDiv);
    hideLoader();

    saveResultsToLocalStorage(resultsDiv.innerHTML);
  } catch (error) {
    console.error("Error generating content:", error);
    resultsDiv.innerHTML = "Error generating text.";
  }
}

function saveResultsToLocalStorage(htmlContent) {
  localStorage.setItem("searchResults", htmlContent);
}

function displayGoogleResults(items) {
  resultsDiv.innerHTML = "";

  if (items && items.length > 0) {
    items.forEach((item) => {
      const resultItem = document.createElement("div");
      resultItem.classList.add("result-item");

      let imageUrl = item.pagemap?.cse_image?.[0]?.src || "";

      resultItem.innerHTML = `
        <h3><a href="${item.link}" target="_blank" style="color: #2e51f5;">${
        item.title
      }</a></h3>
        <a href="${item.link}" target="_blank" style="color: green;">${
        item.displayLink
      }</a>
        ${
          imageUrl
            ? `<img src="${imageUrl}" alt="${item.title}" style="max-width: 100px; margin-top: 10px;" />`
            : ""
        }
        <p>${item.snippet}</p>
      `;

      resultsDiv.appendChild(resultItem);
    });
  } else {
    resultsDiv.innerHTML = "<p>No results found.</p>";
  }
}

function displayGiphyResults(items) {
  resultsDiv.innerHTML = "";

  if (items && items.length > 0) {
    items.forEach((item) => {
      const resultItem = document.createElement("div");
      resultItem.classList.add("result-item");

      resultItem.innerHTML = `
        <h3>${item.title}</h3>
        <img src="${item.images.fixed_height.url}" alt="${item.title}" style="max-width: 100%; margin-top: 10px;">
      `;

      resultsDiv.appendChild(resultItem);
    });
  } else {
    resultsDiv.innerHTML = "<p>No GIFs found.</p>";
  }
}

function displayWikipediaResults(items) {
  resultsDiv.innerHTML = "";

  if (items && items.length > 0) {
    items.forEach((item) => {
      const resultItem = document.createElement("div");
      resultItem.classList.add("result-item");

      resultItem.innerHTML = `
        <h3><a href="https://en.wikipedia.org/wiki/${
          item.title
        }" target="_blank" style="color: #2e51f5;">${item.title}</a></h3>
        <p>${item.snippet.replace(/<\/?[^>]+>/gi, "")}...</p>
      `;

      resultsDiv.appendChild(resultItem);
    });
  } else {
    resultsDiv.innerHTML = "<p>No results found.</p>";
  }
}

themeToggle.addEventListener("change", function () {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");

  darkModeLabel.style.display = isDarkMode ? "inline" : "none";
  lightModeLabel.style.display = isDarkMode ? "none" : "inline";
});

voiceCommandBtn.addEventListener("click", function () {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    const voiceQuery = event.results[0][0].transcript;
    queryInput.value = voiceQuery;
    initiateSearch();
  };

  recognition.start();
});

function displayPaginationControls(nextPage, previousPage, searchEngine) {
  const paginationDiv = document.getElementById("pagination-controls");
  paginationDiv.innerHTML = "";

  if (searchEngine === "google") {
    if (previousPage) {
      const prevButton = document.createElement("button");
      prevButton.innerText = "Previous";
      prevButton.addEventListener("click", function () {
        currentPage--;
        initiateSearch();
      });
      paginationDiv.appendChild(prevButton);
    }

    if (nextPage) {
      const nextButton = document.createElement("button");
      nextButton.innerText = "Next";
      nextButton.addEventListener("click", function () {
        currentPage++;
        initiateSearch();
      });
      paginationDiv.appendChild(nextButton);
    }
  }
}

