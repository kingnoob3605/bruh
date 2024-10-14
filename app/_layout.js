import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import MenuComponent from "./components/MenuComponent";
import PriceComponent from "./components/PriceComponent";
import StockComponent from "./components/StockComponent";
import InventoryComponent from "./components/InventoryComponent";
import SalesReportGenerator from "./SalesReportGenerator";

const images = {
  "icedcoffee.png": "../assets/icedcoffee.png",
  "coffeenutella.png": "../assets/coffeenutella.png",
  "spanishlatte.png": "../assets/spanishlatte.png",
  "hotteatarik.png": "../assets/hotteatarik.png",
  "icecoffeeoreo.png": "../assets/icecoffeeoreo.png",
  "thaicoffee.png": "../assets/thaicoffee.png",
  "wintermelon.png": "../assets/wintermelon.png",
  "matcha.png": "../assets/matcha.png",
  "okinawa.png": "../assets/okinawa.png",
  "icedmilo.png": "../assets/icedmilo.png",
  "chocolate.png": "../assets/chocolate.png",
  "cookieandcream.png": "../assets/cookieandcream.png",
  "matchaberry.png": "../assets/matchaberry.png",
  "nutellahazelnut.png": "../assets/nutellahazelnut.png",
  "strawberry.png": "../assets/strawberry.png",
  "mangoyakult.png": "../assets/mangoyakult.png",
  "bananaberry.png": "../assets/bananaberry.png",
  "tropicalmango.png": "../assets/tropicalmango.png",
  "bluelemon.png": "../assets/bluelemon.png",
};

const INITIAL_MENU = {
  Coffee: [
    { id: "1", name: "Iced Coffee", image: "icedcoffee.png" },
    { id: "2", name: "Coffee Nutella", image: "coffeenutella.png" },
    { id: "3", name: "Spanish Latte", image: "spanishlatte.png" },
    { id: "4", name: "Hot Tea Tarik", image: "hotteatarik.png" },
    { id: "5", name: "Iced Coffee Oreo", image: "icecoffeeoreo.png" },
    { id: "6", name: "Thai Coffee", image: "thaicoffee.png" },
  ],
  "Milk Tea": [
    { id: "11", name: "Wintermelon", image: "wintermelon.png" },
    { id: "12", name: "Matcha", image: "matcha.png" },
    { id: "13", name: "Okinawa", image: "okinawa.png" },
    { id: "14", name: "Iced Milo", image: "icedmilo.png" },
    { id: "15", name: "Chocolate", image: "chocolate.png" },
    { id: "16", name: "Cookies & Cream", image: "cookieandcream.png" },
    { id: "17", name: "Matcha Berry", image: "matchaberry.png" },
    { id: "18", name: "Nutella Hazelnut", image: "nutellahazelnut.png" },
    { id: "19", name: "Strawberry", image: "strawberry.png" },
  ],
  "Fresh Fruits": [
    { id: "25", name: "Mango Yakult", image: "mangoyakult.png" },
    { id: "26", name: "Banana Berry", image: "bananaberry.png" },
    { id: "27", name: "Tropical Mango", image: "tropicalmango.png" },
    { id: "28", name: "Blue Lemon", image: "bluelemon.png" },
  ],
};

const INITIAL_PRICES = {
  Coffee: {
    "Iced Coffee": { "12 oz": 120, "16 oz": 140, "20 oz": 160 },
    "Coffee Nutella": { "12 oz": 120, "16 oz": 140, "20 oz": 160 },
    "Spanish Latte": { "12 oz": 120, "16 oz": 140, "20 oz": 160 },
    "Hot Tea Tarik": { "12 oz": 120, "16 oz": 140, "20 oz": 160 },
    "Iced Coffee Oreo": { "12 oz": 120, "16 oz": 140, "20 oz": 160 },
    "Thai Coffee": { "12 oz": 120, "16 oz": 140, "20 oz": 160 },
  },
  "Milk Tea": {
    Wintermelon: { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    Matcha: { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    Okinawa: { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    "Iced Milo": { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    Chocolate: { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    "Cookies & Cream": { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    "Matcha Berry": { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    "Nutella Hazelnut": { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
    Strawberry: { "12 oz": 140, "16 oz": 160, "20 oz": 180 },
  },
  "Fresh Fruits": {
    "Mango Yakult": { "12 oz": 160, "16 oz": 180, "20 oz": 200 },
    "Banana Berry": { "12 oz": 160, "16 oz": 180, "20 oz": 200 },
    "Tropical Mango": { "12 oz": 160, "16 oz": 180, "20 oz": 200 },
    "Blue Lemon": { "12 oz": 160, "16 oz": 180, "20 oz": 200 },
  },
};

const INITIAL_STOCK = {
  Coffee: {
    "Iced Coffee": 50,
    "Coffee Nutella": 40,
    "Spanish Latte": 45,
    "Hot Tea Tarik": 30,
    "Iced Coffee Oreo": 35,
    "Thai Coffee": 25,
  },
  "Milk Tea": {
    Wintermelon: 60,
    Matcha: 55,
    Okinawa: 50,
    "Iced Milo": 45,
    Chocolate: 40,
    "Cookies & Cream": 50,
    "Matcha Berry": 55,
    "Nutella Hazelnut": 45,
    Strawberry: 50,
  },
  "Fresh Fruits": {
    "Mango Yakult": 70,
    "Banana Berry": 65,
    "Tropical Mango": 60,
    "Blue Lemon": 60,
  },
};

const INITIAL_INVENTORY = {
  "Plastic Cups": 100,
  Straws: 200,
  Milk: 50,
  "Coffee Beans": 80,
  "Tea Leaves": 90,
  Sugar: 150,
  "Fruit Syrups": 70,
};

const AlexaCoffeeApp = () => {
  const [activeView, setActiveView] = useState("Menu");
  const [menu, setMenu] = useState(INITIAL_MENU);
  const [prices, setPrices] = useState(INITIAL_PRICES);
  const [stock, setStock] = useState(INITIAL_STOCK);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [showSalesReport, setShowSalesReport] = useState(false);

  const handleMenuUpdate = useCallback((updatedMenu) => {
    setMenu(updatedMenu);
    saveData(updatedMenu);
  }, []);

  useEffect(() => {
    loadData();
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, []);

  const loadData = async () => {
    try {
      const savedMenu = await AsyncStorage.getItem("menu");
      if (savedMenu) {
        const parsedMenu = JSON.parse(savedMenu);
        // Update the images object with new image data
        Object.keys(parsedMenu).forEach((category) => {
          parsedMenu[category].forEach((item) => {
            if (item.image && item.image.startsWith("data:")) {
              images[item.id] = { uri: item.image };
            }
          });
        });
        setMenu(parsedMenu);
      }
      // Load other data...
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (updatedMenu) => {
    try {
      await AsyncStorage.setItem("menu", JSON.stringify(updatedMenu));
      // Save other data...
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === "inactive" || nextAppState === "background") {
      saveData(menu);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require("../assets/animation.json")}
          autoPlay
          loop
          style={styles.lottieAnimation}
          onError={(error) => {
            console.error("Lottie Error:", error);
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>ALEXA CAFE</Text>
        </View>
        <View style={styles.navbar}>
          {["Menu", "Price", "Stock", "Inventory", "Reports"].map((section) => (
            <TouchableOpacity
              key={section}
              style={[
                styles.navItem,
                activeView === section && styles.activeNavItem,
              ]}
              onPress={() => {
                if (section === "Reports") {
                  setShowSalesReport(!showSalesReport);
                  setActiveView("Reports");
                } else {
                  setActiveView(section);
                  setShowSalesReport(false);
                }
              }}
            >
              <Text
                style={[
                  styles.navItemText,
                  activeView === section && styles.activeNavItemText,
                ]}
              >
                {section}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.content}>
          {showSalesReport ? (
            <SalesReportGenerator purchaseHistory={purchaseHistory} />
          ) : (
            <>
              {activeView === "Menu" && (
                <MenuComponent
                  menu={menu}
                  setMenu={handleMenuUpdate}
                  images={images}
                  updatePrices={(category, item) => {}}
                />
              )}
              {activeView === "Price" && (
                <PriceComponent
                  menu={menu}
                  prices={prices}
                  setPrices={setPrices}
                  images={images}
                  purchaseHistory={purchaseHistory}
                  updatePurchaseHistory={setPurchaseHistory}
                />
              )}
              {activeView === "Stock" && (
                <StockComponent stock={stock} setStock={setStock} />
              )}
              {activeView === "Inventory" && (
                <InventoryComponent
                  inventory={inventory}
                  setInventory={setInventory}
                />
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const colors = {
  primary: "#6F4E37",
  secondary: "#C4A484",
  background: "#FFF8E7",
  text: "#3C2F2F",
  accent: "#FFDB58",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.accent,
    textAlign: "center",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: colors.secondary,
  },
  navItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeNavItem: {
    backgroundColor: colors.accent,
    borderRadius: 15,
  },
  navItemText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  activeNavItemText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: colors.primary,
  },
});

export default AlexaCoffeeApp;
