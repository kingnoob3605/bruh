import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Receipt Modal component for displaying and editing receipts
const ReceiptModal = ({ visible, onClose, receipt, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCashAmount, setEditedCashAmount] = useState(
    receipt ? receipt.cashAmount.toString() : ""
  );
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (receipt) {
      setEditedCashAmount(receipt.cashAmount.toString());
    }
  }, [receipt]);

  // Handle editing of cash amount
  const handleEdit = () => {
    const newCashAmount = parseFloat(editedCashAmount);
    if (isNaN(newCashAmount) || newCashAmount < receipt.total) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount that covers the total."
      );
      return;
    }

    onEdit(receipt.orderNumber, newCashAmount);
    setIsEditing(false);
    setSaveMessage("Changes saved successfully");

    setTimeout(() => {
      setSaveMessage("");
    }, 2000);
  };

  if (!visible || !receipt) return null;

  return (
    <View style={styles.receiptModalOverlay}>
      <View style={styles.receiptModalContent}>
        <TouchableOpacity onPress={onClose} style={styles.closeIconContainer}>
          <AntDesign name="close" size={24} color={colors.primary} />
        </TouchableOpacity>
        <ScrollView style={styles.receiptScrollView}>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptTitle}>Alexa Cafe</Text>
              <MaterialCommunityIcons
                name="coffee"
                size={40}
                color={colors.primary}
                style={styles.receiptIcon}
              />
            </View>
            <Text style={styles.receiptText}>
              Order Number: {receipt.orderNumber}
            </Text>
            <Text style={styles.receiptText}>
              Customer: {receipt.customerName}
            </Text>
            <Text style={styles.receiptText}>
              Date: {new Date(receipt.date).toLocaleString()}
            </Text>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptItemsHeader}>
              <Text style={styles.receiptHeaderText}>Item</Text>
              <Text style={styles.receiptHeaderText}>Qty</Text>
              <Text style={styles.receiptHeaderText}>Price</Text>
            </View>
            {receipt.items.map((item, index) => (
              <View key={`receipt-item-${index}`} style={styles.receiptItem}>
                <Text style={styles.receiptItemText}>
                  {item.name} ({item.size})
                </Text>
                <Text style={styles.receiptItemQty}>{item.quantity}</Text>
                <Text style={styles.receiptItemPrice}>
                  ₱{(item.quantity * item.price || 0).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.receiptDivider} />
            <View style={styles.receiptTotal}>
              <Text style={styles.receiptTotalText}>Total amount:</Text>
              <Text style={styles.receiptTotalText}>
                ₱{(receipt.total || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.receiptTotal}>
              <Text style={styles.receiptTotalText}>Cash:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.cashInput}
                  value={editedCashAmount}
                  onChangeText={setEditedCashAmount}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.receiptTotalText}>
                  ₱{(receipt.cashAmount || 0).toFixed(2)}
                </Text>
              )}
            </View>
            <View style={styles.receiptTotal}>
              <Text style={styles.receiptTotalText}>Balance:</Text>
              <Text style={styles.receiptTotalText}>
                ₱{((receipt.cashAmount || 0) - (receipt.total || 0)).toFixed(2)}
              </Text>
            </View>
            <View style={styles.receiptDivider} />
            <Text style={styles.receiptFooter}>THANK YOU, COME AGAIN!</Text>
          </View>
        </ScrollView>
        {isEditing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleEdit}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        {saveMessage !== "" && (
          <Text style={styles.saveMessage}>{saveMessage}</Text>
        )}
      </View>
    </View>
  );
};

const PriceComponent = ({
  menu,
  prices,
  setPrices,
  images,
  purchaseHistory,
  updatePurchaseHistory,
  deletePurchase,
  editPurchase,
}) => {
  // State declarations
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [purchaseHistoryModalVisible, setPurchaseHistoryModalVisible] =
    useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editingCustomerName, setEditingCustomerName] = useState("");
  const [addDrinkModalVisible, setAddDrinkModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedDrinkSize, setSelectedDrinkSize] = useState(null);
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [isShowingOriginalReceipt, setIsShowingOriginalReceipt] =
    useState(false);
  const [numColumns, setNumColumns] = useState(() =>
    SCREEN_WIDTH >= 1024 ? 6 : SCREEN_WIDTH >= 768 ? 4 : 3
  );
  const [updatePriceModalVisible, setUpdatePriceModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSideDrink, setSelectedSideDrink] = useState(null);
  const [updatedPrices, setUpdatedPrices] = useState({});
  const [orders, setOrders] = useState([]);
  const [weeklyIncome, setWeeklyIncome] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderHistoryModalVisible, setOrderHistoryModalVisible] =
    useState(false);

  // Effect hooks for initializing data and updating layout
  useEffect(() => {
    setUpdatedPrices(JSON.parse(JSON.stringify(prices)));
  }, [prices]);

  useEffect(() => {
    loadOrders();
    loadPurchaseHistory();
  }, []);

  useEffect(() => {
    setUpdatedPrices(JSON.parse(JSON.stringify(prices)));
    loadOrders();
    loadPurchaseHistory();
  }, [prices]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const savedImages = await AsyncStorage.getItem("images");
        if (savedImages) {
          setImages(JSON.parse(savedImages));
        }
      } catch (error) {
        console.error("Error loading images:", error);
      }
    };
    loadImages();
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      setNumColumns(SCREEN_WIDTH >= 1024 ? 6 : SCREEN_WIDTH >= 768 ? 4 : 3);
    };

    const dimensionsHandler = Dimensions.addEventListener(
      "change",
      updateLayout
    );

    return () => {
      dimensionsHandler.remove();
    };
  }, []);

  // Function to load orders from AsyncStorage
  const loadOrders = async () => {
    try {
      const savedOrders = await AsyncStorage.getItem("orders");
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        const ordersWithParsedDates = parsedOrders.map((order) => ({
          ...order,
          date: new Date(order.date),
        }));
        setOrders(ordersWithParsedDates);
        setOrderHistory(ordersWithParsedDates);
        calculateFinancials(ordersWithParsedDates);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  // Function to update prices
  const updatePrices = useCallback((category, itemName = null) => {
    setPrices((prevPrices) => {
      const updatedPrices = { ...prevPrices };
      if (itemName) {
        updatedPrices[category] = {
          ...updatedPrices[category],
          [itemName]: {
            "12 oz": 0,
            "16 oz": 0,
            "20 oz": 0,
          },
        };
      } else {
        updatedPrices[category] = {};
      }
      return updatedPrices;
    });
  }, []);

  // Function to calculate financial summaries
  const calculateFinancials = useCallback((orderList) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let weeklyTotal = 0;
    let allTimeTotal = 0;

    orderList.forEach((order) => {
      const orderDate = new Date(order.date);
      const orderPrice = parseFloat(order.price) || 0;
      allTimeTotal += orderPrice;

      if (orderDate >= oneWeekAgo && orderDate <= now) {
        weeklyTotal += orderPrice;
      }
    });

    setWeeklyIncome(weeklyTotal);
    setTotalPurchases(allTimeTotal);
  }, []);

  // Function to handle removing an order
  const handleRemoveOrder = useCallback(
    (orderNumber) => {
      const removeOrder = () => {
        setOrders((prevOrders) => {
          const updatedOrders = prevOrders.filter(
            (order) => order.orderNumber !== orderNumber
          );
          saveOrders(updatedOrders);
          calculateFinancials(updatedOrders);
          return updatedOrders;
        });
      };

      if (Platform.OS === "web") {
        if (window.confirm("Are you sure you want to remove this order?")) {
          removeOrder();
        }
      } else {
        Alert.alert(
          "Remove Order",
          "Are you sure you want to remove this order?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "OK", onPress: removeOrder },
          ]
        );
      }
    },
    [calculateFinancials]
  );

  // Function to save orders to AsyncStorage
  const saveOrders = async (newOrders) => {
    try {
      await AsyncStorage.setItem("orders", JSON.stringify(newOrders));
    } catch (error) {
      console.error("Error saving orders:", error);
    }
  };

  // Function to add a new order
  const addOrder = useCallback(
    (orderNumber, customerName, price) => {
      const newOrder = {
        orderNumber,
        customerName,
        price: parseFloat(price) || 0,
        date: new Date(),
      };
      setOrders((prevOrders) => {
        const updatedOrders = [...prevOrders, newOrder];
        saveOrders(updatedOrders);
        return updatedOrders;
      });
      setOrderHistory((prevHistory) => [...prevHistory, newOrder]);
      calculateFinancials([...orderHistory, newOrder]);
    },
    [orderHistory, calculateFinancials]
  );

  // Function to add a purchase to history
  const addToPurchaseHistory = useCallback(
    (newPurchase) => {
      updatePurchaseHistory((prevHistory) => [...prevHistory, newPurchase]);
    },
    [updatePurchaseHistory]
  );

  // Function to save purchase history to AsyncStorage
  const savePurchaseHistory = async (history) => {
    try {
      await AsyncStorage.setItem("purchaseHistory", JSON.stringify(history));
    } catch (error) {
      console.error("Error saving purchase history:", error);
    }
  };

  // Function to load purchase history from AsyncStorage
  const loadPurchaseHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("purchaseHistory");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        updatePurchaseHistory(parsedHistory);
      }
    } catch (error) {
      console.error("Error loading purchase history:", error);
    }
  };

  // Function to handle item press (opening modal)
  const handleItemPress = useCallback((item, category) => {
    setSelectedItem({ ...item, category });
    setModalVisible(true);
  }, []);

  // Function to handle adding item to cart
  const handleAddToCart = useCallback(() => {
    if (selectedItem && selectedSize) {
      const price =
        prices[selectedItem.category]?.[selectedItem.name]?.[selectedSize] || 0;
      setCart((prevCart) => [
        ...prevCart,
        {
          ...selectedItem,
          size: selectedSize,
          price: price,
          quantity: 1,
          cartId: Date.now(),
        },
      ]);
      setModalVisible(false);
      setSelectedSize(null);
      setSelectedItem(null);
    } else {
      Alert.alert(
        "Selection Required",
        "Please select a size before adding to cart."
      );
    }
  }, [selectedItem, selectedSize, prices]);

  // Function to handle removing item from cart
  const handleRemoveFromCart = useCallback((cartId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
  }, []);

  // Function to get image source
  const getImageSource = useCallback(
    (imageFileName) => {
      if (images && images[imageFileName]) {
        return images[imageFileName];
      } else if (imageFileName && imageFileName.startsWith("http")) {
        return { uri: imageFileName };
      } else {
        return null;
      }
    },
    [images]
  );

  // Function to calculate total price of items in cart
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const itemPrice = prices[item.category]?.[item.name]?.[item.size] || 0;
      return total + itemPrice;
    }, 0);
  }, [cart, prices]);

  // Function to calculate balance (cash amount - total)
  const calculateBalance = useCallback(() => {
    return parseFloat(cashAmount) - calculateTotal();
  }, [cashAmount, calculateTotal]);

  // Function to generate a unique order number
  const generateOrderNumber = useCallback(() => {
    const timestamp = Date.now();
    const timeString = timestamp.toString(36).slice(-4).toUpperCase();
    const randomLetters = Math.random()
      .toString(36)
      .substring(2, 4)
      .toUpperCase();
    return `${timeString}${randomLetters}`;
  }, []);

  // Function to handle payment process
  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      Alert.alert(
        "Error",
        "Your cart is empty. Please add items before checking out."
      );
      return;
    }

    if (!cashAmount || parseFloat(cashAmount) < calculateTotal()) {
      Alert.alert(
        "Error",
        "Please enter a valid cash amount that covers the total."
      );
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Simulating payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newOrderNumber = generateOrderNumber();
      const total = calculateTotal();
      const balance = calculateBalance();

      const orderDate = new Date();
      orderDate.setHours(0, 0, 0, 0); // Set time to 00:00

      const newReceipt = {
        orderNumber: newOrderNumber,
        customerName,
        items: cart.map((item) => ({
          name: item.name,
          size: item.size,
          price: prices[item.category]?.[item.name]?.[item.size] || 0,
          quantity: item.quantity || 1,
        })),
        total: total,
        cashAmount: parseFloat(cashAmount) || 0,
        balance: balance,
        date: orderDate.toISOString(),
        paymentMethod: "cash",
        isEdited: false,
      };

      setCurrentReceipt(newReceipt);
      updatePurchaseHistory(newReceipt);
      addOrder(
        newReceipt.orderNumber,
        newReceipt.customerName,
        newReceipt.total
      );
      setReceiptModalVisible(true);
      setCheckoutModalVisible(false);
      setCart([]);
      setCustomerName("");
      setCashAmount("");
      setIsShowingOriginalReceipt(true);
    } catch (error) {
      console.error("Payment processing error:", error);
      Alert.alert(
        "Payment Error",
        "An error occurred while processing your payment. Please try again."
      );
    } finally {
      setIsProcessingPayment(false);
    }
  }, [
    cart,
    cashAmount,
    calculateTotal,
    calculateBalance,
    generateOrderNumber,
    customerName,
    prices,
    updatePurchaseHistory,
    addOrder,
  ]);

  // Function to handle editing a purchase
  const handleEditPurchase = useCallback(
    (purchase) => {
      setEditingPurchase({
        ...purchase,
        items: purchase.items.map((item) => ({
          ...item,
          image: menu[item.category]?.find(
            (menuItem) => menuItem.name === item.name
          )?.image,
        })),
      });
      setEditingCustomerName(purchase.customerName || "");
      setEditModalVisible(true);
    },
    [menu]
  );

  // Function to handle updating a purchase
  const handleUpdatePurchase = useCallback(() => {
    if (!editingPurchase) return;

    const updatedPurchase = {
      ...editingPurchase,
      customerName: editingCustomerName,
      total: editingPurchase.items.reduce(
        (total, item) => total + (item.price || 0) * (item.quantity || 1),
        0
      ),
      isEdited: true,
    };

    updatePurchaseHistory((prevHistory) =>
      prevHistory.map((purchase) =>
        purchase.orderNumber === updatedPurchase.orderNumber
          ? updatedPurchase
          : purchase
      )
    );

    setEditingPurchase(null);
    setEditModalVisible(false);
  }, [
    editingPurchase,
    editingCustomerName,
    updatePurchaseHistory,
    editPurchase,
    saveOrders,
    calculateFinancials,
  ]);

  // Function to handle removing a drink from the editing purchase
  const handleRemoveDrink = useCallback((itemIndex) => {
    setEditingPurchase((prevPurchase) => {
      const updatedItems = [...prevPurchase.items];
      updatedItems.splice(itemIndex, 1);
      const updatedPurchase = {
        ...prevPurchase,
        items: updatedItems,
        total: updatedItems.reduce(
          (total, item) => total + (item.price || 0) * (item.quantity || 1),
          0
        ),
        isEdited: true,
      };
      return updatedPurchase;
    });
  }, []);

  // Function to handle adding a drink to the editing purchase
  const handleAddDrink = useCallback(
    (item, size) => {
      if (!prices[item.category] || !prices[item.category][size]) {
        console.error(`Price not found for ${item.name} (${size})`);
        Alert.alert("Error", `Price not available for ${item.name} (${size})`);
        return;
      }
      setSelectedDrink(item);
      setSelectedDrinkSize(size);
    },
    [prices]
  );

  // Function to open the add drink modal
  const openAddDrinkModal = useCallback(() => {
    if (editingPurchase) {
      setAddDrinkModalVisible(true);
    } else {
      Alert.alert(
        "Error",
        "Please select a purchase to edit before adding drinks"
      );
    }
  }, [editingPurchase]);

  // Function to handle drink selection
  const handleDrinkSelection = useCallback(
    (category, drink, size) => {
      setSelectedDrinks((prev) => {
        const existingDrinkIndex = prev.findIndex(
          (item) =>
            item.category === category &&
            item.name === drink.name &&
            item.size === size
        );

        if (existingDrinkIndex !== -1) {
          return prev.filter((_, index) => index !== existingDrinkIndex);
        } else {
          const price = prices[category]?.[drink.name]?.[size];
          return [
            ...prev,
            {
              category,
              name: drink.name,
              size,
              price: price !== undefined ? price : "N/A",
            },
          ];
        }
      });
    },
    [prices]
  );

  // Function to confirm selected drinks
  const handleConfirmDrinks = useCallback(() => {
    if (selectedDrinks.length === 0) return;

    const updatedItems = [...editingPurchase.items];
    selectedDrinks.forEach((newDrink) => {
      const existingItemIndex = updatedItems.findIndex(
        (item) => item.name === newDrink.name && item.size === newDrink.size
      );
      if (existingItemIndex !== -1) {
        updatedItems[existingItemIndex].quantity += 1;
      } else {
        updatedItems.push({ ...newDrink, quantity: 1 });
      }
    });

    const newTotal = updatedItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    const updatedPurchase = {
      ...editingPurchase,
      items: updatedItems,
      total: newTotal,
      isEdited: true,
    };

    editPurchase(updatedPurchase);
    setEditingPurchase(updatedPurchase);
    setSelectedDrinks([]);
    setAddDrinkModalVisible(false);
  }, [editingPurchase, selectedDrinks, editPurchase]);

  // Function to handle deleting an order
  const handleDeleteOrder = useCallback(
    (orderNumber) => {
      console.log("Deleting order:", orderNumber);
      deletePurchase(orderNumber);
      setPurchaseHistoryModalVisible(false);
    },
    [deletePurchase]
  );

  // Function to show receipt
  const handleShowReceipt = useCallback((purchase) => {
    setCurrentReceipt({ ...purchase });
    setPurchaseHistoryModalVisible(false);
    setReceiptModalVisible(true);
    setIsShowingOriginalReceipt(!purchase.isEdited);
  }, []);

  // Function to handle editing a receipt
  const handleEditReceipt = useCallback(
    (orderNumber, newCashAmount) => {
      const updatedPurchaseHistory = purchaseHistory.map((purchase) => {
        if (purchase.orderNumber === orderNumber) {
          const updatedPurchase = {
            ...purchase,
            cashAmount: newCashAmount,
            balance: newCashAmount - purchase.total,
            isEdited: true,
          };
          setCurrentReceipt(updatedPurchase);
          return updatedPurchase;
        }
        return purchase;
      });

      updatePurchaseHistory(updatedPurchaseHistory);
    },
    [purchaseHistory, updatePurchaseHistory]
  );

  // Function to open the update price modal
  const handleOpenUpdatePriceModal = useCallback(() => {
    console.log("Opening update price modal");
    setUpdatePriceModalVisible(true);
  }, []);

  // Function to handle main category selection
  const handleMainCategorySelection = useCallback((category) => {
    console.log("Main category selected:", category);
    setSelectedMainCategory(category);
    setSelectedSubCategory(null);
  }, []);

  // Function to handle sub-category selection
  const handleSubCategorySelection = useCallback((subCategory) => {
    console.log("Sub-category selected:", subCategory);
    setSelectedSubCategory(subCategory);
  }, []);

  // Function to handle category selection
  const handleCategorySelection = useCallback((category) => {
    console.log("Category selected:", category);
    setSelectedCategory(category);
    setSelectedSideDrink(null);
  }, []);

  // Function to handle side drink selection
  const handleSideDrinkSelection = useCallback((drink) => {
    console.log("Side drink selected:", drink);
    setSelectedSideDrink(drink);
  }, []);

  // Function to handle price change
  const handlePriceChange = useCallback(
    (size, value) => {
      console.log("Handling price change:", size, value);
      if (selectedMainCategory && selectedSubCategory) {
        setUpdatedPrices((prev) => ({
          ...prev,
          [selectedMainCategory]: {
            ...prev[selectedMainCategory],
            [selectedSubCategory]: {
              ...prev[selectedMainCategory]?.[selectedSubCategory],
              [size]: parseFloat(value) || 0,
            },
          },
        }));
      }
    },
    [selectedMainCategory, selectedSubCategory]
  );

  // Function to save price changes
  const handleSavePriceChanges = useCallback(() => {
    setPrices(updatedPrices);
    setUpdatePriceModalVisible(false);
    Alert.alert("Success", "Prices have been updated successfully.");
  }, [updatedPrices, setPrices]);

  // Function to render a menu item
  const renderMenuItem = useCallback(
    ({ item, category }) => {
      const imageSource = getImageSource(item.image);

      return (
        <TouchableOpacity
          key={`${category}-${item.id}`}
          style={[styles.menuItem, { width: `${100 / numColumns}%` }]}
          onPress={() => handleItemPress(item, category)}
        >
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]} />
          )}
          <Text style={styles.itemName}>{item.name || "Unnamed Item"}</Text>
        </TouchableOpacity>
      );
    },
    [numColumns, getImageSource, handleItemPress]
  );

  // Function to render a category
  const renderCategory = useCallback(
    ({ item: category }) => (
      <View key={`category-${category}`} style={styles.categoryContainer}>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
        </View>
        <FlatList
          data={menu[category] || []}
          renderItem={({ item }) => renderMenuItem({ item, category })}
          keyExtractor={(item) => `${category}-${item.id}`}
          numColumns={numColumns}
          scrollEnabled={false}
        />
      </View>
    ),
    [menu, numColumns, renderMenuItem]
  );

  // Memoized CartItem component
  const CartItem = React.memo(
    ({ item, handleRemoveFromCart, getImageSource }) => {
      const imageSource = getImageSource(item.image);

      return (
        <View key={item.cartId.toString()} style={styles.cartItem}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.cartItemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cartItemImage, styles.placeholderImage]} />
          )}
          <View style={styles.cartItemDetails}>
            <Text style={styles.cartItemText}>{item.name}</Text>
            <Text style={styles.cartItemSize}>{item.size}</Text>
            <Text style={styles.cartItemPrice}>₱{item.price.toFixed(2)}</Text>
          </View>
          <TouchableOpacity onPress={() => handleRemoveFromCart(item.cartId)}>
            <AntDesign name="minuscircle" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
      );
    }
  );

  // Function to render a purchase history item
  const renderPurchaseHistoryItem = useCallback(
    ({ item: purchase }) => (
      <View style={styles.purchaseHistoryItem}>
        <View style={styles.purchaseHistoryItemContent}>
          <Text style={styles.purchaseHistoryText}>
            Order: {purchase.orderNumber}
          </Text>
          <Text style={styles.purchaseHistoryText}>
            Customer: {purchase.customerName}
          </Text>
          <Text style={styles.purchaseHistoryText}>
            Total: ₱{(purchase.total || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.purchaseHistoryItemButtons}>
          <TouchableOpacity
            style={styles.purchaseHistoryEditButton}
            onPress={() => handleEditPurchase(purchase)}
          >
            <Text style={styles.purchaseHistoryEditButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteOrder(purchase.orderNumber)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.showReceiptButton}
            onPress={() => handleShowReceipt(purchase)}
          >
            <Text style={styles.showReceiptButtonText}>Show Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleEditPurchase, handleDeleteOrder, handleShowReceipt]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <FlatList
          data={Object.keys(menu)}
          renderItem={renderCategory}
          keyExtractor={(item) => `category-${item}`}
          contentContainerStyle={styles.menuList}
          scrollEnabled={false}
        />
      </ScrollView>
      <View style={styles.cartContainer}>
        <Text style={styles.cartTitle}>Your Order</Text>
        <ScrollView style={styles.cartScrollView}>
          {cart.map((item) => (
            <CartItem
              key={item.cartId.toString()}
              item={item}
              handleRemoveFromCart={handleRemoveFromCart}
              getImageSource={getImageSource}
            />
          ))}
        </ScrollView>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => setCheckoutModalVisible(true)}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
          <Feather name="shopping-cart" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setPurchaseHistoryModalVisible(true)}
        >
          <Text style={styles.historyButtonText}>Purchase History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomUpdateButton}
          onPress={handleOpenUpdatePriceModal}
        >
          <Text style={styles.bottomUpdateButtonText}>Update Prices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.orderHistoryButton}
          onPress={() => setOrderHistoryModalVisible(true)}
        >
          <Text style={styles.orderHistoryButtonText}>Order History</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for selecting item size */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.itemSelectionModalView}>
            <Text style={styles.itemSelectionModalTitle}>
              {selectedItem?.name}
            </Text>
            <View style={styles.sizeContainer}>
              {selectedItem &&
                ["12 oz", "16 oz", "20 oz"].map((size) => (
                  <TouchableOpacity
                    key={`size-${size}`}
                    style={[
                      styles.sizeButton,
                      selectedSize === size && styles.selectedSizeButton,
                    ]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={styles.sizeButtonText}>
                      {size} - ₱
                      {(
                        prices[selectedItem.category]?.[selectedItem.name]?.[
                          size
                        ] || 0
                      ).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
            <View style={styles.itemSelectionModalButtons}>
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
              >
                <Text style={styles.buttonText}>Add to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.itemSelectionCancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedSize(null);
                }}
              >
                <Text style={styles.itemSelectionCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for checkout */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={checkoutModalVisible}
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Checkout</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <ScrollView style={styles.checkoutItemsList}>
              {cart.map((item) => (
                <View
                  key={`checkout-${item.cartId}`}
                  style={styles.checkoutItem}
                >
                  <Text>
                    {item.name} - {item.size}
                  </Text>
                  <Text>₱{item.price.toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.totalPrice}>
              Total: ₱{calculateTotal().toFixed(2)}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter cash amount"
              keyboardType="numeric"
              value={cashAmount}
              onChangeText={setCashAmount}
            />
            <TouchableOpacity
              style={[
                styles.payButton,
                isProcessingPayment && styles.payButtonDisabled,
              ]}
              onPress={handlePayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.payButtonText}>Pay</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCheckoutModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for purchase history */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={purchaseHistoryModalVisible}
        onRequestClose={() => setPurchaseHistoryModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Purchase History</Text>
            {purchaseHistory.length > 0 ? (
              <FlatList
                data={purchaseHistory}
                renderItem={renderPurchaseHistoryItem}
                keyExtractor={(item) => item.orderNumber}
                style={styles.purchaseHistoryList}
              />
            ) : (
              <Text style={styles.emptyHistoryText}>
                No purchase history available.
              </Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPurchaseHistoryModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for updating prices */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={updatePriceModalVisible}
        onRequestClose={() => setUpdatePriceModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Update Prices</Text>
            <ScrollView style={styles.updatePriceScrollView}>
              <View style={styles.categorySelection}>
                {Object.keys(menu).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedMainCategory === category &&
                        styles.selectedCategoryButton,
                    ]}
                    onPress={() => handleMainCategorySelection(category)}
                  >
                    <Text style={styles.categoryButtonText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedMainCategory && (
                <View style={styles.subCategorySelection}>
                  {menu[selectedMainCategory].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.subCategoryButton,
                        selectedSubCategory === item.name &&
                          styles.selectedSubCategoryButton,
                      ]}
                      onPress={() => handleSubCategorySelection(item.name)}
                    >
                      <Text style={styles.subCategoryButtonText}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {selectedMainCategory && selectedSubCategory && (
                <View style={styles.priceInputContainer}>
                  {["12 oz", "16 oz", "20 oz"].map((size) => (
                    <View key={size} style={styles.priceInputRow}>
                      <Text style={styles.priceInputLabel}>{size}:</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={String(
                          updatedPrices[selectedMainCategory]?.[
                            selectedSubCategory
                          ]?.[size] || 0
                        )}
                        onChangeText={(value) => handlePriceChange(size, value)}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.savePriceButton}
              onPress={handleSavePriceChanges}
            >
              <Text style={styles.savePriceButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setUpdatePriceModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        visible={receiptModalVisible}
        onClose={() => {
          setReceiptModalVisible(false);
          setPurchaseHistoryModalVisible(true);
        }}
        receipt={currentReceipt}
        onEdit={handleEditReceipt}
      />

      {/* Modal for editing purchase */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Purchase</Text>
            <TextInput
              style={styles.input}
              placeholder="Customer Name"
              value={editingCustomerName}
              onChangeText={setEditingCustomerName}
            />
            <ScrollView style={styles.editItemsList}>
              {editingPurchase?.items.map((item, index) => (
                <View key={`edit-${index}`} style={styles.editItem}>
                  <View style={styles.editItemDetails}>
                    <Text style={styles.editItemText}>
                      {item.quantity} {item.name} - {item.size}
                    </Text>
                    <Text style={styles.editItemPrice}>
                      ₱{(item.price || 0).toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveDrink(index)}>
                    <Feather name="trash-2" size={24} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.addDrinkButton}
              onPress={openAddDrinkModal}
            >
              <Text style={styles.addDrinkButtonText}>Add Drink</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleUpdatePurchase}
            >
              <Text style={styles.confirmButtonText}>Confirm/Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for adding drinks */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addDrinkModalVisible}
        onRequestClose={() => setAddDrinkModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add Drink</Text>
            <ScrollView style={styles.categoryList}>
              {Object.keys(menu).map((category) => (
                <View
                  key={`add-category-${category}`}
                  style={styles.categorySection}
                >
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {menu[category].map((item) => (
                    <View
                      key={`add-drink-${category}-${item.id}`}
                      style={styles.drinkItem}
                    >
                      <Text style={styles.drinkName}>{item.name}</Text>
                      <View style={styles.sizeButtonsContainer}>
                        {["12 oz", "16 oz", "20 oz"].map((size) => {
                          const price = prices[category]?.[item.name]?.[size];
                          return (
                            <TouchableOpacity
                              key={`add-size-${category}-${item.id}-${size}`}
                              style={[
                                styles.sizeButton,
                                selectedDrinks.some(
                                  (drink) =>
                                    drink.category === category &&
                                    drink.name === item.name &&
                                    drink.size === size
                                ) && styles.selectedSizeButton,
                              ]}
                              onPress={() =>
                                handleDrinkSelection(category, item, size)
                              }
                            >
                              <Text style={styles.sizeButtonText}>{size}</Text>
                              <Text style={styles.priceText}>
                                ₱
                                {price !== undefined ? price.toFixed(2) : "N/A"}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmDrinks}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSelectedDrinks([]);
                setAddDrinkModalVisible(false);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for order history */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderHistoryModalVisible}
        onRequestClose={() => setOrderHistoryModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Order History</Text>
            <View style={styles.financialSummary}>
              <Text style={styles.summaryText}>
                Weekly Income: ₱
                {typeof weeklyIncome === "number"
                  ? weeklyIncome.toFixed(2)
                  : "0.00"}
              </Text>
              <Text style={styles.summaryText}>
                Total Purchases: ₱
                {typeof totalPurchases === "number"
                  ? totalPurchases.toFixed(2)
                  : "0.00"}
              </Text>
            </View>
            <ScrollView style={styles.orderHistoryList}>
              {orderHistory.map((order) => (
                <View key={order.orderNumber} style={styles.orderHistoryItem}>
                  <View>
                    <Text>Order Number: {order.orderNumber}</Text>
                    <Text>Customer: {order.customerName}</Text>
                    <Text>
                      Total: ₱
                      {typeof order.price === "number"
                        ? order.price.toFixed(2)
                        : "0.00"}
                    </Text>
                    <Text>Date: {order.date.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeOrderButton}
                    onPress={() => handleRemoveOrder(order.orderNumber)}
                  >
                    <Text style={styles.removeOrderButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setOrderHistoryModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const colors = {
  primary: "#6F4E37",
  secondary: "#C4A484",
  background: "#FFF8E7",
  text: "#3C2F2F",
  accent: "#FFDB58",
  white: "#FFFFFF",
  danger: "#e74c3c",
  border: "#D2B48C",
  modalBackground: "#FFFFFF",
  sizeButtonBackground: "#D2B48C",
  selectedSizeBackground: "#FFDB58",
  addToCartButton: "#8B4513",
  cancelButton: "#A0522D",
  buttonText: "#FFFFFF",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  menuList: {
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitleContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
  },
  menuItem: {
    padding: 16,
    alignItems: "center",
    aspectRatio: 1,
  },
  itemImage: {
    width: "100%",
    height: "80%",
    borderRadius: 10,
    marginBottom: 8,
  },
  placeholderImage: {
    backgroundColor: "#CCCCCC",
  },
  editItemImageContainer: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  editItemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  itemName: {
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
    height: "20%",
  },
  cartContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    maxHeight: "40%",
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
  },
  cartScrollView: {
    maxHeight: 150,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  cartItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "bold",
  },
  cartItemSize: {
    fontSize: 14,
    color: colors.secondary,
  },
  cartItemPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "bold",
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  checkoutButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 18,
    marginRight: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 20,
  },
  sizeContainer: {
    width: "100%",
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  sizeButton: {
    backgroundColor: colors.sizeButtonBackground,
    padding: 8,
    borderRadius: 5,
    marginBottom: 8,
    width: "100%",
    alignItems: "center",
  },
  selectedSizeButton: {
    backgroundColor: colors.selectedSizeBackground,
  },
  sizeButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  priceText: {
    color: colors.text,
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  addToCartButton: {
    backgroundColor: colors.addToCartButton,
    padding: 15,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#D2B48C",
    padding: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#8B4513",
    fontWeight: "bold",
  },
  buttonText: {
    color: colors.buttonText,
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    marginBottom: 20,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  closeButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 18,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  historyButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
  },
  historyButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  bottomUpdateButton: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
  },
  bottomUpdateButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  modalUpdateButton: {
    backgroundColor: "#FFDB58",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%",
  },
  modalUpdateButtonText: {
    color: "#3C2F2F",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  purchaseHistoryList: {
    maxHeight: 300,
    width: "100%",
  },
  purchaseHistoryItem: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  purchaseHistoryItemContent: {
    marginBottom: 10,
  },
  purchaseHistoryItemButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  purchaseHistoryText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  editButton: {
    backgroundColor: colors.accent,
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  editButtonText: {
    color: colors.text,
    fontWeight: "bold",
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: colors.danger,
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButtonText: {
    color: colors.white,
    fontWeight: "bold",
    textAlign: "center",
  },
  showReceiptButton: {
    backgroundColor: colors.secondary,
    padding: 8,
    borderRadius: 5,
    flex: 1,
  },
  showReceiptButtonText: {
    color: colors.text,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyHistoryText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    marginVertical: 20,
  },
  checkoutItemsList: {
    maxHeight: 200,
    width: "100%",
    marginBottom: 10,
  },
  checkoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categorySelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  categoryButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    color: colors.text,
    fontWeight: "bold",
  },
  sideDrinkSelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  sideDrinkButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  selectedSideDrinkButton: {
    backgroundColor: colors.primary,
  },
  sideDrinkButtonText: {
    color: colors.text,
  },
  sizeButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  priceInputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  priceInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceInputLabel: {
    fontSize: 16,
    color: colors.text,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 5,
    width: 100,
    textAlign: "right",
  },
  savePriceButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  savePriceButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  receiptModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  receiptModalContent: {
    backgroundColor: colors.modalBackground,
    borderRadius: 20,
    padding: 20,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 400,
    maxHeight: "90%",
    zIndex: 10000,
  },
  receiptScrollView: {
    maxHeight: "80%",
  },
  receiptContainer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 20,
  },
  receiptHeader: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  receiptTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 10,
  },
  closeIcon: {
    padding: 5,
  },
  receiptIcon: {
    alignSelf: "center",
    marginBottom: 10,
  },
  receiptText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  receiptDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 15,
  },
  receiptItemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  receiptHeaderText: {
    fontWeight: "bold",
    fontSize: 16,
    color: colors.primary,
  },
  receiptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  receiptItemText: {
    fontSize: 14,
    color: colors.text,
    flex: 2,
  },
  receiptItemQty: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  receiptItemPrice: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: "right",
  },
  receiptTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  receiptTotalText: {
    fontWeight: "bold",
    fontSize: 16,
    color: colors.primary,
  },
  receiptFooter: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
    color: colors.primary,
    fontWeight: "bold",
  },
  cashInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 5,
    width: 100,
    textAlign: "right",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 18,
  },
  saveMessage: {
    color: colors.primary,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
  },
  editItemsList: {
    width: "100%",
    maxHeight: 200,
  },
  editItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  addDrinkButton: {
    backgroundColor: "#FFDB58",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%",
  },
  addDrinkButtonText: {
    color: "#3C2F2F",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  categoryList: {
    maxHeight: 300,
    width: "100%",
  },
  categorySection: {
    marginBottom: 20,
  },
  drinkItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  drinkName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 5,
  },
  sizeButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: "#8B4513",
    padding: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  updatePriceScrollView: {
    maxHeight: 400,
    width: "100%",
  },
  closeIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  purchaseHistoryEditButton: {
    backgroundColor: "#FFDB58",
    padding: 8,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  purchaseHistoryEditButtonText: {
    color: "#3C2F2F",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  orderHistoryButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
  },
  orderHistoryButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  orderHistoryList: {
    maxHeight: 300,
    width: "100%",
  },
  orderHistoryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  financialSummary: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 5,
  },
  orderHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  removeOrderButton: {
    backgroundColor: colors.danger,
    padding: 8,
    borderRadius: 5,
  },
  removeOrderButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
  subCategorySelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  subCategoryButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  selectedSubCategoryButton: {
    backgroundColor: colors.primary,
  },
  subCategoryButtonText: {
    color: colors.text,
  },
  editItemsList: {
    maxHeight: 300,
    width: "100%",
    marginBottom: 20,
  },
  editItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  editItemImageContainer: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  editItemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  placeholderImage: {
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  editItemDetails: {
    flex: 1,
  },
  editItemText: {
    fontSize: 16,
  },
  editItemPrice: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "bold",
  },
  addDrinkButton: {
    backgroundColor: "#FFDB58",
    padding: 15,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  addDrinkButtonText: {
    color: "#8B4513",
    fontWeight: "bold",
  },
  modalUpdateButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  modalUpdateButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  itemSelectionModalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  itemSelectionModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
  },
  itemSelectionModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  itemSelectionCancelButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  itemSelectionCancelButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default React.memo(PriceComponent);
