document.addEventListener('DOMContentLoaded', function() {
  // This script contains an SPA flow that requires a dedicated #content shell.
  // For server-rendered EJS pages, skip SPA initialization.
  if (!document.getElementById('content')) {
    return;
  }

  // Initialize router
  initRouter();
  
  // Navbar scroll effect
  initNavbarScrollEffect();
  
  // Initialize Auth
  checkAuthentication();
});

// Router function to handle page navigation without page reloads
function initRouter() {
  const routes = {
    '/': { load: loadHomePage },
    '/menu': { load: loadMenuPage },
    '/cart': { load: loadCartPage, requiresAuth: true },
    '/checkout': { load: loadCheckoutPage, requiresAuth: true },
    '/login': { load: loadLoginPage },
    '/signup': { load: loadSignupPage },
    '/profile': { load: loadProfilePage, requiresAuth: true },
    '/orders': { load: loadOrdersPage, requiresAuth: true },
    '/order-confirmation': { load: loadOrderConfirmationPage, requiresAuth: true }
  };
  
  // Handle navigation
  function navigateTo(url) {
    history.pushState(null, null, url);
    handleRouteChange();
  }
  
  // Handle route change
  async function handleRouteChange() {
    const path = window.location.pathname;
    const route = routes[path] || routes['/'];
    
    // Check if route requires authentication
    if (route.requiresAuth) {
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        navigateTo('/login');
        return;
      }
    }
    
    // Load the route
    route.load();
  }
  
  // Initial route
  handleRouteChange();
  
  // Handle browser back/forward
  window.addEventListener('popstate', handleRouteChange);
  
  // Handle link clicks
  document.addEventListener('click', function(e) {
    if (e.target.matches('a') && e.target.href.includes(window.location.origin)) {
      e.preventDefault();
      navigateTo(e.target.getAttribute('href'));
    }
  });
  
  // Expose navigate function globally
  window.navigateTo = navigateTo;
}

// Function to check if user is authenticated
async function checkAuthentication() {
  try {
    const response = await fetch('/auth/user');
    const data = await response.json();
    
    const authLinks = document.getElementById('authLinks');
    const userMenuContainer = document.getElementById('userMenuContainer');
    const cartLink = document.getElementById('cartLink');
    
    if (data.success) {
      // User is authenticated
      if (authLinks && userMenuContainer) {
        authLinks.classList.add('d-none');
        userMenuContainer.classList.remove('d-none');
        
        // Set user name
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
          userNameElement.textContent = data.user.name;
        }
      }
      
      // Update cart count if cart exists
      if (cartLink) {
        updateCartCount();
      }
      
      return true;
    } else {
      // User is not authenticated
      if (authLinks && userMenuContainer) {
        authLinks.classList.remove('d-none');
        userMenuContainer.classList.add('d-none');
      }
      
      return false;
    }
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
}

// Update cart count
async function updateCartCount() {
  try {
    const response = await fetch('/api/cart');
    const data = await response.json();
    
    if (data.success) {
      const cartCountElement = document.getElementById('cartCount');
      if (cartCountElement) {
        const cartCount = data.cart.reduce((acc, item) => acc + item.quantity, 0);
        
        if (cartCount > 0) {
          cartCountElement.textContent = cartCount;
          cartCountElement.classList.remove('d-none');
        } else {
          cartCountElement.classList.add('d-none');
        }
      }
    }
  } catch (error) {
    console.error('Error fetching cart:', error);
  }
}

// Navbar scroll effect
function initNavbarScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    });
  }
}

// Load Home Page
async function loadHomePage() {
  try {
    const contentContainer = document.getElementById('content');
    
    // Fetch featured items from API
    const response = await fetch('/api/featured');
    const data = await response.json();
    
    if (data.success) {
      // Render hero section and featured items
      let html = `
        <section class="hero">
          <div class="container">
            <div class="row">
              <div class="col-lg-6 hero-content">
                <h1 class="hero-title">Experience Authentic Indian Cuisine</h1>
                <p class="hero-subtitle">Discover the rich, vibrant flavors of India with our expertly crafted dishes made with premium ingredients and traditional spices.</p>
                <a href="/menu" class="btn btn-primary btn-lg hero-btn" onclick="navigateTo('/menu'); return false;">
                  <i class="fas fa-utensils me-2"></i>Explore Our Menu
                </a>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Featured Dishes Section -->
        <section class="section bg-white">
          <div class="container">
            <h2 class="section-title">Featured Dishes</h2>
            <div class="row">
      `;
      
      // Add featured items
      data.featuredItems.forEach(item => {
        html += `
          <div class="col-md-6 col-lg-4 fade-in">
            <div class="menu-item">
              <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}">
                <span class="menu-item-badge ${item.isVegetarian ? 'badge-veg' : 'badge-non-veg'}">
                  ${item.isVegetarian ? 'Veg' : 'Non-Veg'}
                </span>
              </div>
              <div class="menu-item-content">
                <h3 class="menu-item-title">${item.name}</h3>
                <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-footer">
                  <button class="btn btn-primary add-to-cart-btn" data-id="${item._id}">
                    <i class="fas fa-cart-plus me-2"></i>Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      html += `
            </div>
            <div class="text-center mt-4">
              <a href="/menu" class="btn btn-outline-primary" onclick="navigateTo('/menu'); return false;">View Full Menu</a>
            </div>
          </div>
        </section>

        <!-- Cuisine Categories Section -->
        <section class="section" style="background-color: #f5f5f5;">
          <div class="container">
            <h2 class="section-title">Explore Our Cuisine</h2>
            <div class="row justify-content-center text-center">
              <div class="col-md-4 col-sm-6 mb-4 fade-in">
                <div class="category-card p-4 bg-white rounded shadow-sm h-100">
                  <div class="category-icon mb-3">
                    <i class="fas fa-leaf fa-2x text-success"></i>
                  </div>
                  <h3>Vegetarian Delights</h3>
                  <p>Explore our range of flavorful vegetarian dishes crafted with fresh produce and aromatic spices.</p>
                  <a href="/menu?vegetarian=true" class="btn btn-sm btn-outline-success" onclick="navigateTo('/menu?vegetarian=true'); return false;">Explore Veg Menu</a>
                </div>
              </div>
              <div class="col-md-4 col-sm-6 mb-4 fade-in">
                <div class="category-card p-4 bg-white rounded shadow-sm h-100">
                  <div class="category-icon mb-3">
                    <i class="fas fa-drumstick-bite fa-2x text-danger"></i>
                  </div>
                  <h3>Non-Vegetarian Specialties</h3>
                  <p>Savor our non-vegetarian specialties featuring tender meats cooked to perfection with signature spices.</p>
                  <a href="/menu?vegetarian=false" class="btn btn-sm btn-outline-danger" onclick="navigateTo('/menu?vegetarian=false'); return false;">Explore Non-Veg Menu</a>
                </div>
              </div>
              <div class="col-md-4 col-sm-6 mb-4 fade-in">
                <div class="category-card p-4 bg-white rounded shadow-sm h-100">
                  <div class="category-icon mb-3">
                    <i class="fas fa-utensils fa-2x" style="color: var(--primary-color);"></i>
                  </div>
                  <h3>Main Course</h3>
                  <p>Indulge in our hearty main course dishes that bring authentic tastes of India to your table.</p>
                  <a href="/menu?category=Main%20Course" class="btn btn-sm btn-outline-primary" onclick="navigateTo('/menu?category=Main%20Course'); return false;">View Main Course</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Call to Action Section -->
        <section class="section text-center" style="background-color: var(--primary-color); color: white;">
          <div class="container py-5">
            <h2 class="mb-4">Ready to Experience Authentic Indian Flavors?</h2>
            <p class="lead mb-4">Order now and enjoy the rich, aromatic taste of India delivered to your doorstep!</p>
            <a href="/menu" class="btn btn-lg btn-light" onclick="navigateTo('/menu'); return false;">Order Now</a>
          </div>
        </section>
      `;
      
      contentContainer.innerHTML = html;
      
      // Initialize add to cart buttons
      initAddToCartButtons();
      
      // Initialize animation for elements with fade-in class
      initFadeInElements();
    }
  } catch (error) {
    console.error('Error loading home page:', error);
  }
}

// Load Menu Page
async function loadMenuPage() {
  try {
    const contentContainer = document.getElementById('content');
    
    // Get query params
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'All';
    const vegetarian = urlParams.get('vegetarian') || 'All';
    
    // Fetch menu items from API
    const response = await fetch(`/api/menu?category=${category}&vegetarian=${vegetarian}`);
    const data = await response.json();
    
    if (data.success) {
      let html = `
        <section class="section">
          <div class="container">
            <h1 class="section-title">Our Menu</h1>
            
            <!-- Filter Options -->
            <div class="filter-options p-3 mb-4 bg-white rounded shadow-sm">
              <form id="filterForm" class="row g-3">
                <div class="col-md-5">
                  <label for="category" class="form-label">Category</label>
                  <select name="category" id="category" class="form-select">
                    <option value="All" ${category === 'All' ? 'selected' : ''}>All Categories</option>
      `;
      
      // Add category options
      data.categories.forEach(cat => {
        html += `<option value="${cat}" ${category === cat ? 'selected' : ''}>${cat}</option>`;
      });
      
      html += `
                  </select>
                </div>
                <div class="col-md-5">
                  <label for="vegetarian" class="form-label">Dietary Preference</label>
                  <select name="vegetarian" id="vegetarian" class="form-select">
                    <option value="All" ${vegetarian === 'All' ? 'selected' : ''}>All Items</option>
                    <option value="true" ${vegetarian === 'true' ? 'selected' : ''}>Vegetarian Only</option>
                    <option value="false" ${vegetarian === 'false' ? 'selected' : ''}>Non-Vegetarian Only</option>
                  </select>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                  <button type="submit" class="btn btn-primary w-100">Filter</button>
                </div>
              </form>
            </div>
            
            <!-- Diet Preference Toggle -->
            <div class="diet-toggle-container mb-4">
              <h3 class="diet-toggle-title">Select Your Diet Preference</h3>
              <p class="diet-toggle-description">Choose between Normal or Diet option. Diet option will show calorie information for each dish.</p>
              
              <div class="diet-options">
                <div class="diet-option active" data-value="Normal">
                  <i class="fas fa-utensils"></i>
                  <h5>Normal</h5>
                  <p class="small mb-0">Regular menu without calorie information</p>
                </div>
                <div class="diet-option" data-value="Diet">
                  <i class="fas fa-heartbeat"></i>
                  <h5>Diet</h5>
                  <p class="small mb-0">Menu with calorie information for health-conscious choices</p>
                </div>
              </div>
            </div>
            
            <!-- Menu Items -->
            <div class="row">
      `;
      
      if (data.menuItems.length === 0) {
        html += `
          <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-circle fa-3x text-muted mb-3"></i>
            <h3>No items found</h3>
            <p>Try changing your filter options to see more items.</p>
            <a href="/menu" class="btn btn-primary" onclick="navigateTo('/menu'); return false;">View All Items</a>
          </div>
        `;
      } else {
        // Add menu items
        data.menuItems.forEach(item => {
          html += `
            <div class="col-md-6 col-lg-4 mb-4 fade-in">
              <div class="menu-item">
                <div class="menu-item-image">
                  <img src="${item.image}" alt="${item.name}">
                  <span class="menu-item-badge ${item.isVegetarian ? 'badge-veg' : 'badge-non-veg'}">
                    ${item.isVegetarian ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>
                <div class="menu-item-content">
                  <h3 class="menu-item-title">${item.name}</h3>
                  <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
                  <p class="menu-item-description">${item.description}</p>
                  
                  <!-- Calorie info (hidden by default, shown when Diet is selected) -->
                  <div class="calorie-info d-none">
                    <span class="calories-badge">
                      <i class="fas fa-fire-alt me-1"></i> ${item.dietCalories || 0} cal
                    </span>
                  </div>
                  
                  <div class="menu-item-footer mt-3">
                    <button class="btn btn-primary add-to-cart-btn" data-id="${item._id}"
                    data-calories="${item.dietCalories || 0}">
                      <i class="fas fa-cart-plus me-2"></i>Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
      }
      
      html += `
            </div>
          </div>
        </section>
      `;
      
      contentContainer.innerHTML = html;
      
      // Initialize menu page event listeners
      initMenuPageEvents();
      
      // Initialize add to cart buttons
      initAddToCartButtons();
      
      // Initialize animation for elements with fade-in class
      initFadeInElements();
    }
  } catch (error) {
    console.error('Error loading menu page:', error);
  }
}

// Initialize menu page event listeners
function initMenuPageEvents() {
  // Filter form submit
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const category = document.getElementById('category').value;
      const vegetarian = document.getElementById('vegetarian').value;
      
      let url = '/menu';
      const params = [];
      
      if (category !== 'All') {
        params.push(`category=${category}`);
      }
      
      if (vegetarian !== 'All') {
        params.push(`vegetarian=${vegetarian}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      navigateTo(url);
    });
  }
  
  // Diet preference toggle
  const dietOptions = document.querySelectorAll('.diet-option');
  const calorieInfo = document.querySelectorAll('.calorie-info');
  
  if (dietOptions.length > 0) {
    dietOptions.forEach(option => {
      option.addEventListener('click', async function() {
        // Remove active class from all options
        dietOptions.forEach(opt => opt.classList.remove('active'));
        
        // Add active class to clicked option
        this.classList.add('active');
        
        // Update diet preference
        const value = this.getAttribute('data-value');
        window.dietPreference = value;
        
        // Show/hide calorie information based on selection
        if (value === 'Diet') {
          // Prompt for maximum calories
          const maxCalories = await Swal.fire({
            title: 'Enter your daily calorie limit',
            input: 'number',
            inputLabel: 'Maximum Calories',
            inputPlaceholder: 'Enter calories (e.g. 2000)',
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value || value <= 0) {
                return 'Please enter a valid calorie limit!';
              }
            }
          });
          if (maxCalories.isConfirmed) {
            window.maxCalories = parseInt(maxCalories.value);
            calorieInfo.forEach(info => info.classList.remove('d-none'));
          }else{
            // If user cancels, revert to Normal diet
            this.classList.remove('active');
            dietOptions[0].classList.add('active');
            window.dietPreference = 'Normal';
            calorieInfo.forEach(info => info.classList.add('d-none'));
          }
        } else {
          window.maxCalories = null;
          calorieInfo.forEach(info => info.classList.add('d-none'));
        }
      });
    });
  }
}

// Initialize add to cart buttons
function initAddToCartButtons() {
  const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
  
  if (addToCartButtons.length > 0) {
    addToCartButtons.forEach(button => {
      button.addEventListener('click', async function() {
        // Check if user is authenticated
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
          navigateTo('/login');
          return;
        }
        
        const itemId = this.getAttribute('data-id');
        const dietPreference = window.dietPreference || 'Normal';
        const dietCalories = parseInt(this.getAttribute('data-calories')) || 0 ;
        // console.log('Menu Item:', menuItem);
        // console.log('Calories Element:', caloriesElement);
        //  console.log('Diet Calories:', dietCalories);
        // console.log('Diet Preference:', dietPreference);
        
        try {
          const response = await fetch(`/api/cart/add/${itemId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              quantity: 1,
              dietPreference,dietCalories
            })
          });
          console.log('Request Body:', {
            quantity: 1,
            dietPreference,
            dietCalories
          });
          const data = await response.json();
           console.log('Server Response:', data);
          
          if (data.success) {
            // Show success animation
            this.innerHTML = '<i class="fas fa-check"></i> Added';
            this.classList.add('btn-success');
            
            // Update cart count
            updateCartCount();
            
            // Reset button after animation
            setTimeout(() => {
              this.innerHTML = '<i class="fas fa-cart-plus me-2"></i>Add to Cart';
              this.classList.remove('btn-success');
            }, 2000);
          }
        } catch (error) {
          console.error('Error adding to cart:', error);
        }
      });
    });
  }
}

// Load Cart Page
async function loadCartPage() {
  try {
    const contentContainer = document.getElementById('content');
    
    // Fetch cart data
    const response = await fetch('/api/cart');
    const data = await response.json();
    console.log('Cart Data:', data);
    
    if (data.success) {
      const cart = data.cart;
      const totalAmount = data.totalAmount;
      
      let html = `
        <section class="section">
          <div class="container">
            <h1 class="section-title">Your Cart</h1>
      `;
      
      if (!cart || cart.length === 0) {
        html += `
          <div class="cart-empty">
            <i class="fas fa-shopping-cart"></i>
            <h3>Your cart is empty</h3>
            <p class="text-muted">Add some delicious items from our menu!</p>
            <a href="/menu" class="btn btn-primary mt-3" onclick="navigateTo('/menu'); return false;">View Menu</a>
          </div>
        `;
      } else {
        html += `
          <div class="row">
            <div class="col-lg-8">
              <div class="bg-white p-4 rounded shadow-sm">
                <h4 class="mb-3">Cart Items</h4>
        `;
        
        // Add cart items
        cart.forEach((item, index) => {
          html += `
            <div class="cart-item d-flex align-items-center">
              <img src="${item.image}" alt="${item.name}" class="cart-item-img me-3">
              <div class="flex-grow-1">
                <h5 class="mb-1">${item.name}</h5>
                <p class="text-muted mb-0">${item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}</p>
                ${item.dietCalories ? `
                  <span class="calories-badge mt-1">
                    <i class="fas fa-fire-alt me-1"></i> ${item.dietCalories} cal
                  </span>
                ` : ''}
              </div>
              <div class="text-end ms-auto">
                <div class="price mb-2">₹${item.price.toFixed(2)}</div>
                <div class="d-flex align-items-center justify-content-end">
                  <input type="number" value="${item.quantity}" min="1" 
                    class="form-control form-control-sm cart-quantity me-2" 
                    data-index="${index}" style="width: 60px;">
                  <button class="btn btn-sm btn-outline-danger remove-cart-item" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
            ${index < cart.length - 1 ? '<hr>' : ''}
          `;
        });
        
        html += `
                <div class="mt-4 text-end">
                  <button id="clearCartBtn" class="btn btn-outline-secondary me-2">Clear Cart</button>
                  <a href="/menu" class="btn btn-outline-primary" onclick="navigateTo('/menu'); return false;">Add More Items</a>
                </div>
              </div>
            </div>
            
            <div class="col-lg-4 mt-4 mt-lg-0">
              <div class="bg-white p-4 rounded shadow-sm">
                <h4 class="mb-3">Order Summary</h4>
                
                <div class="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>₹${totalAmount.toFixed(2)}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Delivery Fee:</span>
                  <span>₹40.00</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Tax (5%):</span>
                  <span>₹${(totalAmount * 0.05).toFixed(2)}</span>
                </div>
                
                <hr>
                
                <div class="d-flex justify-content-between mb-3">
                  <span class="fw-bold">Total:</span>
                  <span class="fw-bold">₹${(totalAmount + 40 + (totalAmount * 0.05)).toFixed(2)}</span>
                </div>
                
                <a href="/checkout" class="btn btn-primary w-100" onclick="navigateTo('/checkout'); return false;">
                  <i class="fas fa-shopping-bag me-2"></i>Proceed to Checkout
                </a>
              </div>
            </div>
          </div>
        `;
      }
      
      html += `
          </div>
        </section>
      `;
      
      contentContainer.innerHTML = html;
      
      // Initialize cart page event listeners
      initCartPageEvents();
    }
  } catch (error) {
    console.error('Error loading cart page:', error);
  }
}

// Initialize cart page event listeners
function initCartPageEvents() {
  // Update quantity
  const quantityInputs = document.querySelectorAll('.cart-quantity');
  if (quantityInputs.length > 0) {
    quantityInputs.forEach(input => {
      input.addEventListener('change', async function() {
        const index = this.getAttribute('data-index');
        const quantity = parseInt(this.value);
        
        try {
          const response = await fetch(`/api/cart/update/${index}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity })
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Reload cart page to reflect changes
            loadCartPage();
            
            // Update cart count in navbar
            updateCartCount();
          }
        } catch (error) {
          console.error('Error updating cart:', error);
        }
      });
    });
  }
  
  // Remove item
  const removeButtons = document.querySelectorAll('.remove-cart-item');
  if (removeButtons.length > 0) {
    removeButtons.forEach(button => {
      button.addEventListener('click', async function() {
        const index = this.getAttribute('data-index');
        
        try {
          const response = await fetch(`/api/cart/remove/${index}`, {
            method: 'DELETE'
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Reload cart page to reflect changes
            loadCartPage();
            
            // Update cart count in navbar
            updateCartCount();
          }
        } catch (error) {
          console.error('Error removing cart item:', error);
        }
      });
    });
  }
  
  // Clear cart
  const clearCartBtn = document.getElementById('clearCartBtn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async function() {
      try {
        const response = await fetch('/api/cart/clear', {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Reload cart page to reflect changes
          loadCartPage();
          
          // Update cart count in navbar
          updateCartCount();
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    });
  }
}

// Load Checkout Page
async function loadCheckoutPage() {
  try {
    const contentContainer = document.getElementById('content');
    
    // Fetch cart data
    const cartResponse = await fetch('/api/cart');
    const cartData = await cartResponse.json();
    console.log('Checkout Cart Data:', cartData);
    
    // Fetch user data
    const userResponse = await fetch('/api/profile');
    const userData = await userResponse.json();
    
    if (cartData.success && userData.success) {
      const cart = cartData.cart;
      const totalAmount = cartData.totalAmount;
      const dietPreference = cartData.dietPreference;
      const user = userData.user;
      const totalCalories = cart.reduce((acc, item) => acc + (item.dietCalories * item.quantity), 0);
      // console.log(totalCalories);
      // Check if cart is empty
      if (!cart || cart.length === 0) {
        navigateTo('/cart');
        return;
      }
      
      let html = `
        <section class="section">
          <div class="container">
            <h1 class="section-title">Checkout</h1>
            
            <div class="row">
              <div class="col-lg-8">
                <div class="bg-white p-4 rounded shadow-sm mb-4">
                  <h4 class="mb-3">Delivery Information</h4>
                  
                  <form id="checkoutForm">
                    <input type="hidden" name="dietPreference" value="${dietPreference}">
                    
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label for="street" class="form-label">Street Address</label>
                        <input type="text" class="form-control" id="street" name="street" required 
                          value="${user && user.address ? user.address.street || '' : ''}">
                      </div>
                      <div class="col-md-6">
                        <label for="city" class="form-label">City</label>
                        <input type="text" class="form-control" id="city" name="city" required
                          value="${user && user.address ? user.address.city || '' : ''}">
                      </div>
                      <div class="col-md-6">
                        <label for="state" class="form-label">State</label>
                        <input type="text" class="form-control" id="state" name="state" required
                          value="${user && user.address ? user.address.state || '' : ''}">
                      </div>
                      <div class="col-md-6">
                        <label for="zipCode" class="form-label">ZIP Code</label>
                        <input type="text" class="form-control" id="zipCode" name="zipCode" required
                          value="${user && user.address ? user.address.zipCode || '' : ''}">
                      </div>
                      <div class="col-md-6">
                        <label for="phone" class="form-label">Phone Number</label>
                        <input type="tel" class="form-control" id="phone" name="phone" required
                          value="${user ? user.phone || '' : ''}">
                      </div>
                    </div>
                    
                    
                    <hr class="my-4">
                    
                    <h4 class="mb-3">Diet Preference</h4>
                    <div class="my-3">
                      <div class="form-check">
                        <input id="normalDiet" name="dietPreference" type="radio" class="form-check-input" 
                               value="Normal" ${dietPreference === 'Normal' ? 'checked' : ''} required>
                        <label class="form-check-label" for="normalDiet">Normal</label>
                      </div>
                      <div class="form-check">
                        <input id="dietOption" name="dietPreference" type="radio" class="form-check-input" 
                               value="Diet" ${dietPreference === 'Diet' ? 'checked' : ''} required>
                        <label class="form-check-label" for="dietOption">Diet (Calorie conscious)</label>
                      </div>
                    </div>
                    
                    <hr class="my-4">
                    
                    <h4 class="mb-3">Wallet</h4>
                    <div class="alert alert-light border d-flex justify-content-between align-items-center">
                      <span><strong>Current Wallet Balance:</strong></span>
                      <span id="walletBalance" class="fw-bold text-success">₹${Number(user.walletBalance || 0).toFixed(2)}</span>
                    </div>
                    <div class="row g-2 mb-3">
                      <div class="col-md-8">
                        <input type="number" min="1" step="0.01" id="walletTopupAmount" class="form-control" placeholder="Enter amount to add to wallet">
                      </div>
                      <div class="col-md-4">
                        <button type="button" id="addWalletFundsBtn" class="btn btn-outline-success w-100">Add Funds</button>
                      </div>
                    </div>
                    
                    <hr class="my-4">
                    
                    <h4 class="mb-3">Payment</h4>
                    <div class="my-3">
                      <div class="alert alert-success mb-0">
                        <i class="fas fa-wallet me-2"></i>
                        Wallet payment is enabled for this order.
                      </div>
                    </div>
                    <input type="hidden" name="paymentMethod" value="Wallet">

                    
                    <hr class="my-4">
                    
                    <button class="btn btn-primary btn-lg w-100" type="submit">Place Order</button>
                  </form>
                </div>
              </div>
              
              
                  <div class="col-lg-4">
          <div class="bg-white p-4 rounded shadow-sm sticky-top" style="top: 2rem;">
            <h4 class="mb-3">Order Summary</h4>
            
            ${dietPreference === 'Diet' ? `
            <div class="alert alert-info mb-3">
              <i class="fas fa-fire-alt me-2"></i>
              <strong>Total Calories:</strong> ${totalCalories || 0} cal
            </div>`:''}
            
                  
                  <div class="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>₹${totalAmount.toFixed(2)}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Delivery Fee:</span>
                    <span>₹40.00</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Tax (5%):</span>
                    <span>₹${(totalAmount * 0.05).toFixed(2)}</span>
                  </div>
                  
                  <hr>
                  
                  <div class="d-flex justify-content-between mb-3">
                    <span class="fw-bold">Total:</span>
                    <span class="fw-bold" id="payableAmount">₹${(totalAmount + 40 + (totalAmount * 0.05)).toFixed(2)}</span>
                  </div>
                  
                  <div class="mb-3">
                    <h5 class="mb-2">Items in Cart</h5>
                    <ul class="list-group">
                    ${cart.map(item => `
                      <li class="list-group-item d-flex justify-content-between lh-sm">
                        <div>
                          <h6 class="my-0">${item.name} × ${item.quantity}</h6>
                          <small class="text-muted">
                            ${item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
                            ${dietPreference === 'Diet' ? `<br>${item.dietCalories || 0} cal/serving` : ''}
                          </small>
                        </div>
                        <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                
                <a href="/cart" class="btn btn-outline-secondary w-100" onclick="navigateTo('/cart'); return false;">
                  Edit Cart
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
      
      
      // Add cart items
      // cart.forEach(item => {
      //   html += `
      //     <li class="list-group-item d-flex justify-content-between lh-sm">
      //       <div>
      //         <h6 class="my-0">${item.name} × ${item.quantity}</h6>
      //         <small class="text-muted">${item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
      //         ${dietPreference==='Diet' ? `<br>${item.dietCalories}cal/serving`: ''}</small>
      //       </div>
      //       <span>₹${(item.price * item.quantity).toFixed(2)}</span>
      //     </li>
      //   `;
      // });
      
      // html += `
      //               </ul>
      //             </div>
                  
      //             <a href="/cart" class="btn btn-outline-secondary w-100" onclick="navigateTo('/cart'); return false;">Edit Cart</a>
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   </section>
      // `;
      
      contentContainer.innerHTML = html;
      
      // Initialize checkout form
      initCheckoutForm();
    }
  } catch (error) {
    console.error('Error loading checkout page:', error);
  }
}

// Initialize checkout form
function initCheckoutForm() {
  const checkoutForm = document.getElementById('checkoutForm');
  const walletBalanceElement = document.getElementById('walletBalance');
  const addWalletFundsBtn = document.getElementById('addWalletFundsBtn');
  const walletTopupAmount = document.getElementById('walletTopupAmount');
  const payableAmountElement = document.getElementById('payableAmount');

  const parseCurrency = (text) => Number((text || '').replace(/[^\d.]/g, '')) || 0;
  const getWalletBalance = () => parseCurrency(walletBalanceElement ? walletBalanceElement.textContent : '0');
  const getPayableAmount = () => parseCurrency(payableAmountElement ? payableAmountElement.textContent : '0');

  const refreshWalletBalance = async () => {
    const response = await fetch('/api/wallet');
    const data = await response.json();
    if (data.success && walletBalanceElement) {
      walletBalanceElement.textContent = `₹${Number(data.walletBalance || 0).toFixed(2)}`;
    }
    return data;
  };

  if (addWalletFundsBtn && walletTopupAmount) {
    addWalletFundsBtn.addEventListener('click', async function() {
      const amount = Number(walletTopupAmount.value);
      if (!Number.isFinite(amount) || amount <= 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Invalid Amount',
          text: 'Enter a valid amount greater than 0.',
          confirmButtonText: 'OK'
        });
        return;
      }

      addWalletFundsBtn.disabled = true;
      try {
        const response = await fetch('/api/wallet/add-funds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to add funds');
        }

        await refreshWalletBalance();
        walletTopupAmount.value = '';
        await Swal.fire({
          icon: 'success',
          title: 'Wallet Updated',
          text: 'Funds were added to your wallet successfully.',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Wallet Update Failed',
          text: error.message || 'Could not add funds to wallet.',
          confirmButtonText: 'OK'
        });
      } finally {
        addWalletFundsBtn.disabled = false;
      }
    });
  }
  
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      // if (window.dietPreference === 'Diet' && window.maxCalories) {
      //   const totalCalories = cart.reduce((acc, item) => acc + (parseInt(item.dietCalories || 0) * item.quantity), 0);
      //   if (totalCalories > window.maxCalories) {
          // await Swal.fire({
          //   icon: 'warning',
          //   title: 'Calorie Limit Exceeded',
          //   text: `Your order total of ${totalCalories} calories exceeds your daily limit of ${window.maxCalories} calories.`,
          //   confirmButtonText: 'Modify Order'
          // });
          // return;
        // }
      // }
      try {
        // Get cart data first
        const cartResponse = await fetch('/api/cart');
        const cartData = await cartResponse.json();
        
        if (!cartData.success) {
          throw new Error('Failed to get cart data');
        }
        
        const cart = cartData.cart;
        
        // Check calories if diet preference is enabled
        if (window.dietPreference === 'Diet' && window.maxCalories) {
          const totalCalories = cart.reduce((acc, item) => acc + (parseInt(item.dietCalories || 0) * item.quantity), 0);
          if (totalCalories > window.maxCalories) {
            await Swal.fire({
              icon: 'warning',
              title: 'Calorie Limit Exceeded',
              text: `Your order total of ${totalCalories} calories exceeds your daily limit of ${window.maxCalories} calories.`,
              confirmButtonText: 'Modify Order'
            });
            return;
          }
        }

        if (getWalletBalance() < getPayableAmount()) {
          await Swal.fire({
            icon: 'warning',
            title: 'Insufficient Wallet Balance',
            text: 'Please add funds before placing your order.',
            confirmButtonText: 'OK'
          });
          return;
        }
        // Get form data
        const formData = {
          street: document.getElementById('street').value,
          city: document.getElementById('city').value,
          state: document.getElementById('state').value,
          zipCode: document.getElementById('zipCode').value,
          phone: document.getElementById('phone').value,
          dietPreference: document.querySelector('input[name="dietPreference"]:checked').value,
          paymentMethod: 'Wallet'
        };
        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        const response = await fetch('/api/orders/place', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          await refreshWalletBalance();
          await Swal.fire({
            icon: 'success',
            title: 'Order Placed Successfully!',
            text: 'Your order has been placed and will be delivered soon.',
            confirmButtonText: 'View Order'
          });
          // Navigate to order confirmation page
          window.orderData = data.order;
          navigateTo('/order-confirmation');
          
          // Update cart count
          updateCartCount();
        }else{
          throw new Error(data.message || 'Failed to place order');
        }
      } catch (error) {
        console.error('Error placing order:', error);
        Swal.fire({
          icon: 'error',
          title: 'Order Failed',
          text: error.message || 'Failed to place your order. Please try again.',
          confirmButtonText: 'OK'
      });
    }finally {
      // Reset button state
      const submitButton = checkoutForm.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.innerHTML = 'Place Order';
    }
      
    });
  }
}

// Load Order Confirmation Page
function loadOrderConfirmationPage() {
  try {
    const contentContainer = document.getElementById('content');
    const order = window.orderData;
    
    if (!order) {
      navigateTo('/');
      return;
    }
    
    let html = `
      <section class="section">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-8">
              <div class="bg-white p-5 rounded shadow-sm order-confirmation">
                <i class="fas fa-check-circle text-success"></i>
                <h2>Order Confirmed!</h2>
                <p class="lead">Thank you for your order. Your delicious food is being prepared.</p>
                
                <div class="order-details bg-light p-4 mt-4 mb-4 rounded text-start">
                  <h4 class="mb-3">Order Details</h4>
                  <p><strong>Order ID:</strong> ${order._id}</p>
                  <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                  <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                  <p><strong>Diet Preference:</strong> ${order.dietPreference}</p>
                  <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                  <p><strong>Delivery Address:</strong> ${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.zipCode}</p>
                </div>
                
                <div class="text-center">
                  <a href="/orders" class="btn btn-primary me-2" onclick="navigateTo('/orders'); return false;">View Order History</a>
                  <a href="/" class="btn btn-outline-secondary" onclick="navigateTo('/'); return false;">Return to Home</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    
    contentContainer.innerHTML = html;
    
    // Clear order data after showing confirmation
    window.orderData = null;
  } catch (error) {
    console.error('Error loading order confirmation page:', error);
  }
}

// Load Orders Page
async function loadOrdersPage() {
  try {
    const contentContainer = document.getElementById('content');
    
    // Fetch order history
    const response = await fetch('/api/orders/history');
    const data = await response.json();
    
    if (data.success) {
      const orders = data.orders;
      
      let html = `
        <section class="section">
          <div class="container">
            <h1 class="section-title">Order History</h1>
            
            <div class="row justify-content-center">
              <div class="col-lg-10">
      `;
      
      if (orders.length === 0) {
        html += `
          <div class="text-center py-5">
            <i class="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
            <h3>No orders yet</h3>
            <p class="text-muted">You haven't placed any orders yet. Start ordering delicious food!</p>
            <a href="/menu" class="btn btn-primary mt-3" onclick="navigateTo('/menu'); return false;">View Menu</a>
          </div>
        `;
      } else {
        html += `
          <div class="bg-white p-4 rounded shadow-sm">
            <h4 class="mb-4">Your Orders</h4>
        `;
        
        // Add orders
        orders.forEach(order => {
          html += `
            <div class="card mb-4">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <span>
                  <strong>Order #${order._id.substring(0, 8)}</strong> 
                  <span class="ms-2 badge bg-${getStatusBadgeColor(order.status)}">${order.status}</span>
                </span>
                <span class="text-muted">${new Date(order.orderDate).toLocaleDateString()}</span>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Items:</strong> ${order.items.length}</p>
                    <p><strong>Diet Preference:</strong> ${order.dietPreference}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                  </div>
                  <div class="col-md-6 text-md-end">
                    <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
                    <button class="btn btn-sm btn-outline-primary view-order-details" data-id="${order._id}">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        
        html += `
          </div>
        `;
      }
      
      html += `
              </div>
            </div>
          </div>
        </section>
      `;
      
      contentContainer.innerHTML = html;
      
      // Initialize view order details buttons
      initViewOrderDetailsButtons();
    }
  } catch (error) {
    console.error('Error loading orders page:', error);
  }
}

// Get status badge color
function getStatusBadgeColor(status) {
  switch (status) {
    case 'Pending':
      return 'warning';
    case 'Confirmed':
      return 'info';
    case 'Preparing':
      return 'primary';
    case 'On the way':
      return 'info';
    case 'Delivered':
      return 'success';
    case 'Cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
}

// Initialize view order details buttons
function initViewOrderDetailsButtons() {
  const viewOrderDetailsButtons = document.querySelectorAll('.view-order-details');
  
  if (viewOrderDetailsButtons.length > 0) {
    viewOrderDetailsButtons.forEach(button => {
      button.addEventListener('click', async function() {
        const orderId = this.getAttribute('data-id');
        
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          const data = await response.json();
          
          if (data.success) {
            // Show order details modal
            showOrderDetailsModal(data.order);
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      });
    });
  }
}

// Show order details modal
function showOrderDetailsModal(order) {
  // Create modal element
  const modalElement = document.createElement('div');
  modalElement.className = 'modal fade';
  modalElement.id = 'orderDetailsModal';
  modalElement.tabIndex = '-1';
  modalElement.setAttribute('aria-labelledby', 'orderDetailsModalLabel');
  modalElement.setAttribute('aria-hidden', 'true');
  
  // Create modal HTML
  modalElement.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="orderDetailsModalLabel">Order #${order._id.substring(0, 8)}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <h6>Order Information</h6>
              <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
              <p><strong>Status:</strong> <span class="badge bg-${getStatusBadgeColor(order.status)}">${order.status}</span></p>
              <p><strong>Diet Preference:</strong> ${order.dietPreference}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            </div>
            <div class="col-md-6">
              <h6>Delivery Address</h6>
              <p>${order.deliveryAddress.street}<br>
              ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.zipCode}<br>
              Phone: ${order.phoneNumber}</p>
            </div>
          </div>
          
          <h6>Order Items</h6>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
  `;
  
  // Add order items
  order.items.forEach(item => {
    modalElement.querySelector('tbody').innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td>${item.quantity}</td>
        <td class="text-end">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `;
  });
  
  // Add order summary
  modalElement.querySelector('.modal-body').innerHTML += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end"><strong>Subtotal:</strong></td>
                <td class="text-end">₹${order.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Delivery Fee:</strong></td>
                <td class="text-end">₹40.00</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Tax (5%):</strong></td>
                <td class="text-end">₹${(order.totalAmount * 0.05).toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end"><strong>Total:</strong></td>
                <td class="text-end"><strong>₹${(order.totalAmount + 40 + (order.totalAmount * 0.05)).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  `;
  
  // Add modal to body
  document.body.appendChild(modalElement);
  
  // Initialize and show modal
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
  
  // Remove modal from DOM when hidden
  modalElement.addEventListener('hidden.bs.modal', function() {
    document.body.removeChild(modalElement);
  });
}

// Load Login Page
function loadLoginPage() {
  const contentContainer = document.getElementById('content');
  
  let html = `
    <section class="section">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="auth-form-wrapper">
              <div class="form-container">
                <h2 class="text-center mb-4">Login</h2>
                
                <div id="loginAlert" class="alert alert-danger d-none"></div>
                
                <form id="loginForm">
                  <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" name="password" required>
                  </div>
                  
                  <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary">Login</button>
                  </div>
                </form>
                
                <div class="text-center mt-3">
                  <p>
                    Don't have an account? 
                    <a href="/signup" onclick="navigateTo('/signup'); return false;">Sign Up</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  
  contentContainer.innerHTML = html;
  
  // Initialize login form
  initLoginForm();
}

// Initialize login form
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update authentication status
          await checkAuthentication();
          
          // Redirect to home page
          navigateTo('/');
        } else {
          // Show error message
          loginAlert.textContent = data.message;
          loginAlert.classList.remove('d-none');
        }
      } catch (error) {
        console.error('Login error:', error);
        loginAlert.textContent = 'An error occurred during login';
        loginAlert.classList.remove('d-none');
      }
    });
  }
}

// Load Signup Page
function loadSignupPage() {
  const contentContainer = document.getElementById('content');
  
  let html = `
    <section class="section">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="auth-form-wrapper">
              <div class="form-container">
                <h2 class="text-center mb-4">Create Account</h2>
                
                <div id="signupAlert" class="alert alert-danger d-none"></div>
                
                <form id="signupForm">
                  <div class="mb-3">
                    <label for="name" class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="name" name="name" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" name="email" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="phone" class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="phone" name="phone" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="password" name="password" required minlength="6">
                    <div class="form-text">Password must be at least 6 characters long</div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="confirmPassword" class="form-label">Confirm Password</label>
                    <input type="password" class="form-control" id="confirmPassword" name="confirmPassword" required>
                  </div>
                  
                  <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary">Sign Up</button>
                  </div>
                </form>
                
                <div class="text-center mt-3">
                  <p>
                    Already have an account? 
                    <a href="/login" onclick="navigateTo('/login'); return false;">Login</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  
  contentContainer.innerHTML = html;
  
  // Initialize signup form
  initSignupForm();
}

// Initialize signup form
function initSignupForm() {
  const signupForm = document.getElementById('signupForm');
  const signupAlert = document.getElementById('signupAlert');
  
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Validate passwords match
      if (password !== confirmPassword) {
        signupAlert.textContent = 'Passwords do not match';
        signupAlert.classList.remove('d-none');
        return;
      }
      
      try {
        const response = await fetch('/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            password,
            confirmPassword
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update authentication status
          await checkAuthentication();
          
          // Redirect to home page
          navigateTo('/');
        } else {
          // Show error message
          signupAlert.textContent = data.message;
          signupAlert.classList.remove('d-none');
        }
      } catch (error) {
        console.error('Signup error:', error);
        signupAlert.textContent = 'An error occurred during sign up';
        signupAlert.classList.remove('d-none');
      }
    });
  }
}

// Load Profile Page
async function loadProfilePage() {
  try {
    const contentContainer = document.getElementById('content');
    
    // Fetch user data
    const response = await fetch('/api/profile');
    const data = await response.json();
    
    if (data.success) {
      const user = data.user;
      
      let html = `
        <section class="section">
          <div class="container">
            <div class="row justify-content-center">
              <div class="col-md-8">
                <div class="form-container">
                  <h2 class="mb-4">My Profile</h2>
                  
                  <div id="profileAlert" class="alert alert-success d-none"></div>
                  
                  <form id="profileForm">
                    <div class="mb-4">
                      <h5>Personal Information</h5>
                      <div class="row g-3">
                        <div class="col-md-6">
                          <label for="name" class="form-label">Full Name</label>
                          <input type="text" class="form-control" id="name" name="name" value="${user.name || ''}" required>
                        </div>
                        <div class="col-md-6">
                          <label for="email" class="form-label">Email</label>
                          <input type="email" class="form-control" id="email" value="${user.email || ''}" disabled>
                        </div>
                        <div class="col-md-6">
                          <label for="phone" class="form-label">Phone Number</label>
                          <input type="tel" class="form-control" id="phone" name="phone" value="${user.phone || ''}">
                        </div>
                      </div>
                    </div>
                    
                    <div class="mb-4">
                      <h5>Address Information</h5>
                      <div class="row g-3">
                        <div class="col-12">
                          <label for="street" class="form-label">Street Address</label>
                          <input type="text" class="form-control" id="street" name="street" value="${user.address?.street || ''}">
                        </div>
                        <div class="col-md-4">
                          <label for="city" class="form-label">City</label>
                          <input type="text" class="form-control" id="city" name="city" value="${user.address?.city || ''}">
                        </div>
                        <div class="col-md-4">
                          <label for="state" class="form-label">State</label>
                          <input type="text" class="form-control" id="state" name="state" value="${user.address?.state || ''}">
                        </div>
                        <div class="col-md-4">
                          <label for="zipCode" class="form-label">ZIP Code</label>
                          <input type="text" class="form-control" id="zipCode" name="zipCode" value="${user.address?.zipCode || ''}">
                        </div>
                      </div>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                      <a href="/orders" class="btn btn-outline-primary" onclick="navigateTo('/orders'); return false;">
                        <i class="fas fa-history me-2"></i>Order History
                      </a>
                      <div>
                        <button id="logoutBtn" type="button" class="btn btn-outline-danger me-2">Logout</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;
      
      contentContainer.innerHTML = html;
      
      // Initialize profile form
      initProfileForm();
    }
  } catch (error) {
    console.error('Error loading profile page:', error);
  }
}

// Initialize profile form
function initProfileForm() {
  const profileForm = document.getElementById('profileForm');
  const profileAlert = document.getElementById('profileAlert');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get form data
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const street = document.getElementById('street').value;
      const city = document.getElementById('city').value;
      const state = document.getElementById('state').value;
      const zipCode = document.getElementById('zipCode').value;
      
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            phone,
            street,
            city,
            state,
            zipCode
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Show success message
          profileAlert.textContent = 'Profile updated successfully';
          profileAlert.classList.remove('d-none', 'alert-danger');
          profileAlert.classList.add('alert-success');
          
          // Update authentication
          await checkAuthentication();
          
          // Hide alert after 3 seconds
          setTimeout(() => {
            profileAlert.classList.add('d-none');
          }, 3000);
        } else {
          // Show error message
          profileAlert.textContent = data.message;
          profileAlert.classList.remove('d-none', 'alert-success');
          profileAlert.classList.add('alert-danger');
        }
      } catch (error) {
        console.error('Profile update error:', error);
        profileAlert.textContent = 'An error occurred while updating profile';
        profileAlert.classList.remove('d-none', 'alert-success');
        profileAlert.classList.add('alert-danger');
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      try {
        const response = await fetch('/auth/logout', {
          method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update authentication status
          await checkAuthentication();
          
          // Redirect to home page
          navigateTo('/');
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
}

// Initialize fade-in elements animation
function initFadeInElements() {
  const fadeElements = document.querySelectorAll('.fade-in');
  
  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(element => {
      observer.observe(element);
    });
  }
}
