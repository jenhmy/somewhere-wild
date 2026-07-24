/* =========================
   DOM ELEMENTS
========================= */

const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const siteLogo = document.getElementById("siteLogo");

const gallery = document.getElementById("gallery");
const galleryInfo = document.getElementById("galleryInfo");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");

const searchBox = document.getElementById("searchBox");
const searchToggle = document.getElementById("searchToggle");
const searchIcon = document.getElementById("searchIcon");
const featuredToggle = document.getElementById("featuredToggle");

const filterDropdown = document.getElementById("filterDropdown");
const filterToggle = document.getElementById("filterToggle");
const filterToggleText = document.getElementById("filterToggleText");

const placeGallery = document.getElementById("placeGallery");
const placeInfo = document.getElementById("placeInfo");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const lightboxClose = document.getElementById("lightboxClose");

const homeIntro = document.getElementById("homeIntro");
const homeIntroReveal = document.querySelector(".home-intro-reveal");
const homeIntroLogo = document.querySelector(".home-intro-logo");

/* =========================
   STATE
========================= */
let photos = [];
let lightboxImages = [];
let lightboxIndex = 0;
let lightboxAlt = "";

let activeFilter = {
  type: "all",
  value: "all"
};

/* =========================
   THEME
========================= */

function setImageForTheme(image, isLightTheme) {
  if (!image) return;

  const lightImage =
    image.dataset.lightLogo || image.dataset.lightIcon;

  const darkImage =
    image.dataset.darkLogo || image.dataset.darkIcon;

  image.src = isLightTheme ? lightImage : darkImage;
}

function updateThemeImages(isLightTheme) {
  [
    themeIcon,
    searchIcon,
    siteLogo,
    homeIntroLogo
  ].forEach(image => setImageForTheme(image, isLightTheme));
}

function applyStoredTheme() {
  const isLightTheme =
    localStorage.getItem("theme") === "light";

  document.body.classList.toggle(
    "light-theme",
    isLightTheme
  );

  updateThemeImages(isLightTheme);
}

function toggleTheme() {
  const isLightTheme =
    !document.body.classList.contains("light-theme");

  document.body.classList.toggle(
    "light-theme",
    isLightTheme
  );

  localStorage.setItem(
    "theme",
    isLightTheme ? "light" : "dark"
  );

  updateThemeImages(isLightTheme);
}

applyStoredTheme();

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}

function showGalleryInfo(title) {
  if (!galleryInfo) return;

  if (!title || title === "all") {
    galleryInfo.innerHTML = "";
    return;
  }

  galleryInfo.innerHTML = `
    <div class="place-submenu-text">
      <h1>${title}</h1>
    </div>
  `;
}

/* =========================
   MOBILE MENU
========================= */

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");

    navToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  siteNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================
   DATA
========================= */

if (gallery || placeGallery) {
  fetch("data/photos.json")
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return response.json();
    })
    .then(data => {
      photos = sortByDate(data);

      if (gallery) {
        applyUrlFilterOrShowAll();
      }

      if (placeGallery) {
        showPlaceGallery();
      }
    })
    .catch(error => {
      console.error("Error loading photos:", error);

      if (gallery) {
        gallery.innerHTML = "<p>Photos could not be loaded.</p>";
      }

      if (placeGallery) {
        placeGallery.innerHTML = "<p>Photos could not be loaded.</p>";
      }
    });
}

function showPlaceGallery() {
  if (!placeGallery) return;

  const params = new URLSearchParams(window.location.search);
  const placeId = params.get("id");

  const place = photos.find(photo => photo.id === placeId);

  if (!place) {
    if (placeInfo) {
      placeInfo.innerHTML = "";
    }

    placeGallery.innerHTML = "<p>Place not found.</p>";
    return;
  }

  setPlaceActiveCountry(getPhotoCountry(place));
  showPlaceInfo(place);

  const samePlacePhotos = getSamePlacePhotos(place);

  const samePlaceImages = samePlacePhotos.flatMap(photo =>
    photo.images.map(imageSrc => ({
      src: imageSrc,
      photo
    }))
  );

  showPlaceImages(samePlaceImages, place);
}

function showPlaceImages(images, place) {
  placeGallery.innerHTML = "";

  const imageSources = images.map(item => item.src);

  images.forEach((imageItem, index) => {
    const imageSrc = imageItem.src;
    const imagePhoto = imageItem.photo;

    const card = document.createElement("article");
    card.classList.add("card");

    const delay = Math.min(index * 90, 900);
    card.style.setProperty("--reveal-delay", `${delay}ms`);

    card.innerHTML = `
      <img
        src="${imageSrc}"
        alt="${getPhotoTitle(place)}"
        draggable="false"
      >

      <div class="card-info">
        <h2>${getPhotoTitle(place)}</h2>
        <p class="card-date">${getPhotoDate(imagePhoto)}</p>
      </div>
    `;

    const openImage = () => {
      card.classList.add("is-opening");

      openLightbox(imageSources, index, imagePhoto);

      setTimeout(() => {
        card.classList.remove("is-opening");
      }, 900);
    };

    card.addEventListener("click", openImage);

    card.addEventListener("contextmenu", event => {
      event.preventDefault();
      openImage();
    });

    placeGallery.appendChild(card);
  });

  revealCards();
}

function setPlaceActiveCountry(country) {
  filterButtons.forEach(button => {
    const isActive =
      button.dataset.filterType === "country" &&
      button.dataset.filterValue === country;

    button.classList.toggle("active", isActive);

    if (isActive && filterToggleText) {
      filterToggleText.textContent = button.textContent;
    }
  });
}

/* =========================
   HELPERS
========================= */

function sortByDate(list) {
  return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getPhotoTitle(photo) {
  return photo.title || "";
}

function getPhotoCover(photo) {
  return photo.cover || "";
}

function getPhotoCountry(photo) {
  return photo.country  || "";
}

function getPhotoRegion(photo) {
  return photo.region || "";
}

function getPhotoArea(photo) {
  return photo.area || "";
}

function getPhotoLocationParts(photo) {
  const parts = [
    getPhotoArea(photo),
    getPhotoRegion(photo),
    getPhotoCountry(photo)
  ].filter(Boolean);

  return [...new Set(parts)];
}

function getPhotoLocation(photo) {
  return photo.location || getPhotoLocationParts(photo).join(" · ");
}

function getPhotoGoogleMaps(photo) {
  return photo.googleMaps || "";
}

function getPhotoWikiloc(photo) {
  return photo.wikiloc || "";
}

function getSamePlacePhotos(selectedPlace) {
  return photos.filter(photo =>
    getPhotoTitle(photo) === getPhotoTitle(selectedPlace) &&
    getPhotoArea(photo) === getPhotoArea(selectedPlace) &&
    getPhotoRegion(photo) === getPhotoRegion(selectedPlace) &&
    getPhotoCountry(photo) === getPhotoCountry(selectedPlace)
  );
}

function showPlaceInfo(place) {
  if (!placeInfo) return;

  const googleMapsUrl = getPhotoGoogleMaps(place);
  const wikilocUrl = getPhotoWikiloc(place);
  const hasLinks = googleMapsUrl || wikilocUrl;
  const locationParts = [
    {
      type: "area",
      value: getPhotoArea(place)
    },
    {
      type: "region",
      value: getPhotoRegion(place)
    },
    {
      type: "country",
      value: getPhotoCountry(place)
    }
  ].filter(item => item.value);

  placeInfo.innerHTML = `
    <div class="place-submenu-text">
      <h1>${getPhotoTitle(place)}</h1>

      ${locationParts.length > 0 ? `
        <p>
          ${locationParts.map((item, index) => `
            ${index > 0 ? `<span>·</span>` : ""}
            <button class="place-filter-link" data-filter-type="${item.type}" data-filter-value="${item.value}">
              ${item.value}
            </button>
          `).join("")}
        </p>
      ` : ""}
    </div>

    <div class="place-submenu-actions">
      ${googleMapsUrl ? `<a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">Google Maps</a>` : ""}
      ${wikilocUrl ? `<a href="${wikilocUrl}" target="_blank" rel="noopener noreferrer">Wikiloc</a>` : ""}
    </div>
  `;

  placeInfo.querySelectorAll(".place-filter-link").forEach(link => {
    link.addEventListener("click", () => {
      goToFilteredGallery(link.dataset.filterType, link.dataset.filterValue);
    });
  });

  placeInfo.classList.toggle("has-links", Boolean(hasLinks));
}

function getPhotoDate(photo) {
  return photo.date || "";
}

function getFilterValue(photo, filterType) {
  const values = {
    featured: String(photo.featured === true),
    area: getPhotoArea(photo),
    region: getPhotoRegion(photo),
    country: getPhotoCountry(photo)
  };

  return values[filterType] || "";
}

function goToFilteredGallery(filterType, filterValue) {
  if (!filterValue) return;

  const encodedType = encodeURIComponent(filterType);
  const encodedValue = encodeURIComponent(filterValue);

  window.location.href = `gallery.html?filterType=${encodedType}&filterValue=${encodedValue}`;
}

/* =========================
   GALLERY
========================= */

function showPhotos(list) {
  if (!gallery) return;

  gallery.innerHTML = "";

  list.forEach((photo, index) => {
    const card = document.createElement("article");
    card.classList.add("card");

    const delay = Math.min(index * 90, 900);
    card.style.setProperty("--reveal-delay", `${delay}ms`);

    card.innerHTML = `
      <a class="card-link" href="place.html?id=${encodeURIComponent(photo.id)}">
        <img src="${getPhotoCover(photo)}" alt="${getPhotoTitle(photo)}" draggable="false">
        <div class="card-info">
          <h2>${getPhotoTitle(photo)}</h2>
          <p>${getPhotoLocation(photo)}</p>
        </div>
      </a>
    `;

    card.addEventListener("contextmenu", event => {
      event.preventDefault();

      window.location.href =
        `place.html?id=${encodeURIComponent(photo.id)}`;
    });

    gallery.appendChild(card);


  });

  revealCards();
}

function applyFilters() {
  if (!gallery) return;

  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const result = photos.filter(photo => {
    const matchesFilter =
      activeFilter.value === "all" ||
      getFilterValue(photo, activeFilter.type) === activeFilter.value;

    const fullText = `
      ${getPhotoTitle(photo)}
      ${getPhotoCountry(photo)}
      ${getPhotoRegion(photo)}
      ${getPhotoArea(photo)}
    `.toLowerCase();

    return matchesFilter && fullText.includes(searchText);
  });

  showPhotos(result);
}

function setActiveFilter(type, value) {
  activeFilter = { type, value };

  showGalleryInfo(type === "featured" ? "" : value);

  if (searchInput) {
    searchInput.value = "";
  }

  filterButtons.forEach(button => {
    const isActive =
      button.dataset.filterType === type &&
      button.dataset.filterValue === value;

    button.classList.toggle("active", isActive);

    if (isActive && filterToggleText) {
      filterToggleText.textContent = button.textContent;
    }
  });

  if (featuredToggle) {
    const isFeaturedActive =
      type === "featured" &&
      value === "true";

    featuredToggle.classList.toggle("active", isFeaturedActive);
  }

  applyFilters();
}

function applyUrlFilterOrShowAll() {
  const params = new URLSearchParams(window.location.search);

  const filterType = params.get("filterType");
  const filterValue = params.get("filterValue");
  const searchValue = params.get("search");

  if (filterType && filterValue) {
    setActiveFilter(filterType, filterValue);
  } else {
    activeFilter = {
      type: "all",
      value: "all"
    };

    showGalleryInfo("");
    showPhotos(photos);
  }

  if (searchValue && searchInput) {
    searchInput.value = searchValue;

    if (searchBox) {
      searchBox.classList.add("open");
    }

    applyFilters();
  }
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    const filterType = button.dataset.filterType;
    const filterValue = button.dataset.filterValue;

    if (placeGallery) {
      if (filterValue === "all") {
        window.location.href = "gallery.html";
      } else {
        goToFilteredGallery(filterType, filterValue);
      }

      return;
    }

    setActiveFilter(filterType, filterValue);
  });
});

if (searchInput) {
  searchInput.addEventListener("input", () => {
    if (gallery) {
      applyFilters();
    }
  });

  searchInput.addEventListener("keydown", event => {
    if (!placeGallery || event.key !== "Enter") return;

    const searchText = searchInput.value.trim();

    if (!searchText) return;

    window.location.href =
      `gallery.html?search=${encodeURIComponent(searchText)}`;
  });
}

/* =========================
   SEARCH
========================= */

if (searchBox && searchToggle && searchInput) {
  searchToggle.addEventListener("click", () => {
    searchBox.classList.toggle("open");

    if (searchBox.classList.contains("open")) {
      searchInput.focus();
    } else {
      searchInput.value = "";
      applyFilters();
    }
  });

  document.addEventListener("click", event => {
    const clickedInsideSearch = searchBox.contains(event.target);

    if (!clickedInsideSearch && searchInput.value.trim() === "") {
      searchBox.classList.remove("open");
    }
  });
}

/* =========================
   FILTER DROPDOWN
========================= */

if (filterDropdown && filterToggle) {
  filterToggle.addEventListener("click", event => {
    event.stopPropagation();

    const isOpen =
      filterDropdown.classList.toggle("open");

    filterToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  filterDropdown
    .querySelectorAll(".filter-btn")
    .forEach(button => {
      button.addEventListener("click", () => {
        filterDropdown.classList.remove("open");
        filterToggle.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    });

  document.addEventListener("click", event => {
    if (!filterDropdown.contains(event.target)) {
      filterDropdown.classList.remove("open");
      filterToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  });
}

/* =========================
   CARD ANIMATIONS
========================= */

const revealCards = () => {
  const cards = document.querySelectorAll(".card:not(.is-visible)");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  cards.forEach(card => observer.observe(card));
};

/* =========================
   LIGHTBOX
========================= */

function openLightbox(images, index, place) {
  if (!lightbox || !lightboxImage || !images || images.length === 0) return;

  lightboxImages = images;
  lightboxIndex = index;
  lightboxAlt = getPhotoTitle(place);

  updateLightboxImage();
  lightbox.classList.add("open");
}

function updateLightboxImage() {
  if (!lightboxImage || lightboxImages.length === 0) return;

  lightboxImage.classList.add("is-changing");

  setTimeout(() => {
    lightboxImage.src = lightboxImages[lightboxIndex];
    lightboxImage.alt = lightboxAlt;

    lightboxImage.onload = () => {
      lightboxImage.classList.remove("is-changing");      
    };
  }, 180);
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;

  lightbox.classList.remove("open");
  lightboxImage.classList.remove("is-changing");

  setTimeout(() => {
    lightboxImage.src = "";
    lightboxImage.alt = "";
    lightboxImages = [];
    lightboxIndex = 0;
    lightboxAlt = "";

  }, 450);
}

function showNextLightboxImage() {
  if (lightboxImages.length === 0) return;

  lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
  updateLightboxImage();
}

function showPreviousLightboxImage() {
  if (lightboxImages.length === 0) return;

  lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
  updateLightboxImage();
}

document.addEventListener("keydown", event => {
  if (!lightbox || !lightbox.classList.contains("open")) return;

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowRight") {
    showNextLightboxImage();
  }

  if (event.key === "ArrowLeft") {
    showPreviousLightboxImage();
  }
});

if (lightboxNext) {
  lightboxNext.addEventListener("click", event => {
    event.stopPropagation();
    showNextLightboxImage();
  });
}

if (lightboxPrev) {
  lightboxPrev.addEventListener("click", event => {
    event.stopPropagation();
    showPreviousLightboxImage();
  });
}

if (lightboxClose) {
  lightboxClose.addEventListener("click", event => {
    event.stopPropagation();
    closeLightbox();
  });
}

if (lightbox) {
  lightbox.addEventListener("click", event => {
    if (lightboxWasSwiped) {
      lightboxWasSwiped = false;
      return;
    }

    const clickedArrow = event.target.closest(".lightbox-arrow");
    const clickedClose = event.target.closest(".lightbox-close");

    if (!clickedArrow && !clickedClose) {
      closeLightbox();
    }
  });
}

let lightboxWheelLocked = false;
let lightboxTouchStartX = 0;
let lightboxTouchStartY = 0;
let lightboxWasSwiped = false;

if (lightbox) {
  lightbox.addEventListener("wheel", event => {
    if (!lightbox.classList.contains("open")) return;
    if (lightboxWheelLocked) return;

    event.preventDefault();

    lightboxWheelLocked = true;

    if (event.deltaY > 0) {
      showNextLightboxImage();
    } else {
      showPreviousLightboxImage();
    }

    setTimeout(() => {
      lightboxWheelLocked = false;
    }, 500);
  }, { passive: false });
}

if (lightbox) {
  lightbox.addEventListener(
    "touchstart",
    event => {
      if (!lightbox.classList.contains("open")) return;

      const touch = event.changedTouches[0];

      lightboxTouchStartX = touch.clientX;
      lightboxTouchStartY = touch.clientY;
      lightboxWasSwiped = false;
    },
    { passive: true }
  );

  lightbox.addEventListener(
    "touchend",
    event => {
      if (!lightbox.classList.contains("open")) return;

      const touch = event.changedTouches[0];

      const distanceX = touch.clientX - lightboxTouchStartX;
      const distanceY = touch.clientY - lightboxTouchStartY;

      const minimumSwipeDistance = 50;
      const isHorizontalSwipe =
        Math.abs(distanceX) > Math.abs(distanceY);

      if (
        isHorizontalSwipe &&
        Math.abs(distanceX) >= minimumSwipeDistance
      ) {
        lightboxWasSwiped = true;

        if (distanceX < 0) {
          showNextLightboxImage();
        } else {
          showPreviousLightboxImage();
        }
      }
    },
    { passive: true }
  );
}

if (lightbox) {
  lightbox.addEventListener("contextmenu", event => {
    event.preventDefault();
    closeLightbox();
  });
}

/* =========================
   HOME INTRO
========================= */

function revealHomeIntro() {
  if (!homeIntro || !homeIntroReveal) return;

  requestAnimationFrame(() => {
    setTimeout(() => {
      homeIntroReveal.classList.add("is-visible");
    }, 180);
  });
}

revealHomeIntro();

if (featuredToggle) {
  featuredToggle.addEventListener("click", () => {

    if (placeGallery) {
      goToFilteredGallery("featured", "true");
      return;
    }

    const isAlreadyActive =
      activeFilter.type === "featured" &&
      activeFilter.value === "true";

    if (isAlreadyActive) {
      setActiveFilter("all", "all");
    } else {
      setActiveFilter("featured", "true");
    }
  });
}

document.addEventListener("dragstart", event => {
  if (event.target instanceof HTMLImageElement) {
    event.preventDefault();
  }
});