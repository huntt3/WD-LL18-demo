// --- DOM elements ---
const randomBtn = document.getElementById("random-btn");
const recipeDisplay = document.getElementById("recipe-display");
const savedRecipesContainer = document.getElementById("saved-recipes-container");
const savedRecipesList = document.getElementById("saved-recipes-list");

// Load saved recipes from localStorage
function loadSavedRecipes() {
  const saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];
  savedRecipesList.innerHTML = "";
  if (saved.length > 0) {
    savedRecipesContainer.style.display = "block";
    saved.forEach(name => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = name;
      span.className = "cursor-pointer text-rose-700 hover:underline mr-2";
      span.addEventListener("click", () => loadRecipeByName(name));

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "text-sm text-white bg-rose-500 hover:bg-rose-600 px-2 py-1 rounded";
      deleteBtn.addEventListener("click", () => deleteSavedRecipe(name));

      li.appendChild(span);
      li.appendChild(deleteBtn);
      li.className = "flex items-center justify-between mb-1";
      savedRecipesList.appendChild(li);
    });
  } else {
    savedRecipesContainer.style.display = "none";
  }
}

// Save the current recipe name to localStorage
function saveCurrentRecipe() {
  const saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];
  const name = window.currentRecipeData?.strMeal;
  if (name && !saved.includes(name)) {
    saved.push(name);
    localStorage.setItem("savedRecipes", JSON.stringify(saved));
    loadSavedRecipes();
  }
}

// Delete a saved recipe
function deleteSavedRecipe(name) {
  let saved = JSON.parse(localStorage.getItem("savedRecipes")) || [];
  saved = saved.filter(n => n !== name);
  localStorage.setItem("savedRecipes", JSON.stringify(saved));
  loadSavedRecipes();
}

// Load full recipe details by name
async function loadRecipeByName(name) {
  recipeDisplay.innerHTML = "<p>Loading saved recipe...</p>";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`);
    const data = await res.json();
    const recipe = data.meals?.[0];
    if (recipe) {
      window.currentRecipeData = recipe;
      renderRecipe(recipe);
    } else {
      recipeDisplay.innerHTML = "<p>Sorry, we couldn't find that recipe.</p>";
    }
  } catch (error) {
    recipeDisplay.innerHTML = "<p>Error loading saved recipe.</p>";
  }
}

// This function creates a list of ingredients for the recipe from the API data
function getIngredientsHtml(recipe) {
  let html = "";
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) html += `<li>${meas ? `${meas} ` : ""}${ing}</li>`;
  }
  return html;
}

// This function displays the recipe on the page
function renderRecipe(recipe) {
  recipeDisplay.innerHTML = `
    <div class="recipe-title-row mb-2">
      <h2 class="text-2xl font-semibold text-rose-700 mb-2">${recipe.strMeal}</h2>
    </div>
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="w-full max-w-xs mx-auto rounded shadow mb-4" />
    <h3 class="text-lg font-medium text-stone-700">Ingredients:</h3>
    <ul class="list-disc list-inside mb-4">${getIngredientsHtml(recipe)}</ul>
    <h3 class="text-lg font-medium text-stone-700">Instructions:</h3>
    <p class="text-stone-700 leading-relaxed mb-4">${recipe.strInstructions.replace(/\r?\n/g, "<br>")}</p>
    <button id="save-recipe-btn" class="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded shadow">Save Recipe</button>
  `;

  const saveBtn = document.getElementById("save-recipe-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveCurrentRecipe);
  }
}

// This function gets a random recipe from the API and shows it
async function fetchAndDisplayRandomRecipe() {
  recipeDisplay.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
    const data = await res.json();
    const recipe = data.meals[0];
    window.currentRecipeData = recipe;
    renderRecipe(recipe);
  } catch (error) {
    recipeDisplay.innerHTML = "<p>Sorry, couldn't load a recipe.</p>";
  }
}

// Event listeners
randomBtn.addEventListener("click", fetchAndDisplayRandomRecipe);
document.addEventListener("DOMContentLoaded", () => {
  loadSavedRecipes();
  fetchAndDisplayRandomRecipe();
});

// Remix function using OpenAI
async function remixRecipeWithAI(recipeData, remixTheme) {
  const remixResult = document.getElementById('remix-output');
  remixResult.innerHTML = `
    <div class="text-stone-700 text-center">
      <span class="block text-2xl">🍽️ Crafting a delicious twist just for you...</span>
      <span class="block mt-2">Hang tight while our culinary magic happens! ✨</span>
    </div>
  `;

  try {
    const prompt = `You are a creative chef! Given this recipe (in JSON) and the remix theme, create a short, fun, doable remix. Highlight any changed ingredients or instructions.\n\nRemix Theme: ${remixTheme}\nRecipe JSON: ${JSON.stringify(recipeData)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: 'You are a creative chef assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.8
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      remixResult.textContent = data.choices[0].message.content.trim();
    } else {
      remixResult.innerHTML = `
        <div class="text-center text-rose-600">
          <p>😓 Oops! Something went wrong while creating your remix.</p>
          <p>Please try again in a moment.</p>
        </div>
      `;
    }
  } catch (error) {
    remixResult.innerHTML = `
      <div class="text-center text-rose-600">
        <p>😓 Oops! Something went wrong while creating your remix.</p>
        <p>Please check your connection and try again.</p>
      </div>
    `;
  }
}

const remixBtn = document.getElementById('remix-btn');
const remixThemeInput = document.getElementById('remix-theme');
if (remixBtn && remixThemeInput) {
  remixBtn.addEventListener('click', async () => {
    const recipeData = window.currentRecipeData;
    const remixTheme = remixThemeInput.value;
    if (recipeData && remixTheme) {
      await remixRecipeWithAI(recipeData, remixTheme);
    }
  });
}
