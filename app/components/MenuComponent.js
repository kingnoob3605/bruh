import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Platform,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useWindowDimensions } from "react-native";

const MenuItem = React.memo(({ item, itemWidth, getImageSource }) => {
  const [imageError, setImageError] = useState(false);
  const imageSource = getImageSource(item.image);

  return (
    <View style={[styles.menuItem, { width: itemWidth }]}>
      <View style={styles.menuItemImageContainer}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.menuItemImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.menuItemImage, styles.placeholderImage]}>
            <Feather name="image" size={24} color="#888" />
            <Text style={styles.placeholderText}>
              {imageError ? "Failed to load image" : "No image available"}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.menuItemText}>{item.name}</Text>
    </View>
  );
});

const MenuComponent = ({ menu, setMenu, images, updatePrices }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemImage, setNewItemImage] = useState(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [itemWidth, setItemWidth] = useState("48%");
  const [errorMessage, setErrorMessage] = useState("");
  const [isWeb, setIsWeb] = useState(false);
  const [fabAnimation] = useState(new Animated.Value(0));
  const [modalAnimation] = useState(new Animated.Value(0));

  const { width } = useWindowDimensions();
  const [numColumns, setNumColumns] = useState(2);

  useEffect(() => {
    setIsWeb(Platform.OS === "web");
  }, []);

  useEffect(() => {
    if (width >= 1024) {
      setNumColumns(4);
      setItemWidth("23%");
    } else if (width >= 768) {
      setNumColumns(3);
      setItemWidth("31%");
    } else {
      setNumColumns(2);
      setItemWidth("48%");
    }
  }, [width]);

  useEffect(() => {
    animateFab();
  }, []);

  const animateFab = () => {
    Animated.spring(fabAnimation, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animateModal = () => {
    Animated.spring(modalAnimation, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  const handleManageMenu = () => {
    setActionModalVisible(true);
    animateModal();
  };

  const handleAddItemOrCategory = () => {
    setModalMode("addItemOrCategory");
    setSelectedCategory("");
    setNewItemName("");
    setNewItemImage(null);
    setNewCategoryName("");
    setErrorMessage("");
    setActionModalVisible(false);
    setModalVisible(true);
    animateModal();
  };

  const handleUpdateItem = () => {
    setModalMode("update");
    setSelectedCategory("");
    setSelectedItem("");
    setNewItemName("");
    setNewItemImage(null);
    setErrorMessage("");
    setActionModalVisible(false);
    setModalVisible(true);
    animateModal();
  };

  const handleRemoveItemOrCategory = () => {
    setModalMode("removeItemOrCategory");
    setSelectedCategory("");
    setSelectedItem("");
    setErrorMessage("");
    setActionModalVisible(false);
    setModalVisible(true);
    animateModal();
  };

  const handleImagePick = async () => {
    if (isWeb) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setNewItemImage(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setNewItemImage(result.assets[0].uri);
      }
    }
  };

  const validateInput = () => {
    if (modalMode === "addItemOrCategory") {
      if (newCategoryName) {
        if (!newCategoryName.trim()) {
          setErrorMessage("Please enter a category name");
          return false;
        }
        if (Object.keys(menu).includes(newCategoryName.trim())) {
          setErrorMessage("A category with this name already exists");
          return false;
        }
      } else {
        if (!selectedCategory) {
          setErrorMessage("Please select a category");
          return false;
        }
        if (!newItemName.trim()) {
          setErrorMessage("Please enter an item name");
          return false;
        }
        if (
          menu[selectedCategory].some(
            (item) =>
              item.name.toLowerCase() === newItemName.trim().toLowerCase()
          )
        ) {
          setErrorMessage(
            "An item with this name already exists in the selected category"
          );
          return false;
        }
      }
    } else if (modalMode === "update") {
      if (!selectedCategory || !selectedItem) {
        setErrorMessage("Please select both a category and an item");
        return false;
      }
      if (!newItemName.trim()) {
        setErrorMessage("Please enter an item name");
        return false;
      }
    } else if (modalMode === "removeItemOrCategory") {
      if (!selectedCategory) {
        setErrorMessage("Please select a category");
        return false;
      }
    }
    setErrorMessage("");
    return true;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    if (modalMode === "addItemOrCategory") {
      if (newCategoryName) {
        // Add new category
        setMenu((prevMenu) => {
          const updatedMenu = {
            ...prevMenu,
            [newCategoryName.trim()]: [],
          };
          updatePrices(newCategoryName.trim());
          return updatedMenu;
        });
      } else {
        // Add new item
        const newItem = {
          id: Date.now().toString(),
          name: newItemName.trim(),
          image: newItemImage,
        };
        setMenu((prevMenu) => {
          const updatedMenu = {
            ...prevMenu,
            [selectedCategory]: [...prevMenu[selectedCategory], newItem],
          };
          updatePrices(selectedCategory, newItem.name);
          return updatedMenu;
        });
      }
    } else if (modalMode === "update") {
      const updatedItem = {
        id: selectedItem,
        name: newItemName.trim(),
        image: newItemImage,
      };
      setMenu((prevMenu) => {
        const updatedMenu = {
          ...prevMenu,
          [selectedCategory]: prevMenu[selectedCategory].map((item) =>
            item.id === selectedItem ? updatedItem : item
          ),
        };
        return updatedMenu;
      });
    } else if (modalMode === "removeItemOrCategory") {
      if (selectedItem) {
        // Remove item
        setMenu((prevMenu) => {
          const updatedMenu = {
            ...prevMenu,
            [selectedCategory]: prevMenu[selectedCategory].filter(
              (item) => item.id !== selectedItem
            ),
          };
          return updatedMenu;
        });
      } else if (selectedCategory) {
        // Remove category
        const removeCategoryAction = () => {
          setMenu((prevMenu) => {
            const { [selectedCategory]: removed, ...rest } = prevMenu;
            return rest;
          });
        };

        if (isWeb) {
          const confirmRemove = window.confirm(
            `Are you sure you want to remove the category "${selectedCategory}" and all its items?`
          );
          if (confirmRemove) {
            removeCategoryAction();
          }
        } else {
          Alert.alert(
            "Remove Category",
            `Are you sure you want to remove the category "${selectedCategory}" and all its items?`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "OK",
                onPress: removeCategoryAction,
              },
            ],
            { cancelable: false }
          );
        }
      }
    }
    setModalVisible(false);
  };

  const getImageSource = useCallback(
    (imageFileName) => {
      if (images && images[imageFileName]) {
        return images[imageFileName];
      } else if (imageFileName) {
        if (isWeb && imageFileName.startsWith("data:")) {
          return { uri: imageFileName };
        } else if (
          !isWeb &&
          (imageFileName.startsWith("file://") ||
            imageFileName.startsWith("content://"))
        ) {
          return { uri: imageFileName };
        }
      }
      return null;
    },
    [images, isWeb]
  );

  const renderMenuItem = useCallback(
    ({ item }) => (
      <MenuItem
        item={item}
        itemWidth={itemWidth}
        getImageSource={getImageSource}
      />
    ),
    [itemWidth, getImageSource]
  );

  const renderCategory = useCallback(
    ({ item: category }) => (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <FlatList
          key={`category_${category}_columns_${numColumns}`}
          data={menu[category]}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.menuItemsContainer}
        />
      </View>
    ),
    [menu, numColumns, renderMenuItem]
  );

  const sortedMenuCategories = useMemo(() => Object.keys(menu).sort(), [menu]);

  const fabScale = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const modalScale = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <View style={styles.menuContainer}>
      <FlatList
        data={sortedMenuCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item}
      />
      <Animated.View
        style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}
      >
        <TouchableOpacity style={styles.fabButton} onPress={handleManageMenu}>
          <Feather name="menu" color="#FFFFFF" size={24} />
        </TouchableOpacity>
      </Animated.View>

      {/* Action Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <Animated.View
            style={[styles.modalView, { transform: [{ scale: modalScale }] }]}
          >
            <Text style={styles.modalTitle}>Manage Menu</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleUpdateItem}
            >
              <Text style={styles.modalButtonText}>Update Item</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddItemOrCategory}
            >
              <Text style={styles.modalButtonText}>Add New Item/Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleRemoveItemOrCategory}
            >
              <Text style={styles.modalButtonText}>Remove Item/Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Add/Update/Remove Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <Animated.View
            style={[styles.modalView, { transform: [{ scale: modalScale }] }]}
          >
            <ScrollView>
              <Text style={styles.modalTitle}>
                {modalMode === "addItemOrCategory"
                  ? "Add New Item/Category"
                  : modalMode === "update"
                  ? "Update Item"
                  : "Remove Item/Category"}
              </Text>
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}
              {modalMode === "addItemOrCategory" && (
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segmentedButton,
                      !newCategoryName && styles.segmentedButtonActive,
                    ]}
                    onPress={() => setNewCategoryName("")}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        !newCategoryName && styles.segmentedButtonTextActive,
                      ]}
                    >
                      Add Item
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.segmentedButton,
                      newCategoryName && styles.segmentedButtonActive,
                    ]}
                    onPress={() => {
                      setNewCategoryName("New Category");
                      setSelectedCategory("");
                    }}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        newCategoryName && styles.segmentedButtonTextActive,
                      ]}
                    >
                      Add Category
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {(modalMode === "addItemOrCategory" && !newCategoryName) ||
              modalMode === "update" ||
              modalMode === "removeItemOrCategory" ? (
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={(itemValue) => {
                    setSelectedCategory(itemValue);
                    setSelectedItem("");
                    if (modalMode === "update") {
                      setNewItemName("");
                      setNewItemImage(null);
                    }
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a category" value="" />
                  {Object.keys(menu).map((category) => (
                    <Picker.Item
                      key={category}
                      label={category}
                      value={category}
                    />
                  ))}
                </Picker>
              ) : null}
              {modalMode === "addItemOrCategory" && !newCategoryName && (
                <>
                  <TextInput
                    style={styles.input}
                    onChangeText={setNewItemName}
                    value={newItemName}
                    placeholder="Enter item name"
                  />
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={handleImagePick}
                  >
                    <Text style={styles.buttonText}>
                      {newItemImage ? "Change Image" : "Upload Image"}
                    </Text>
                  </TouchableOpacity>
                  {newItemImage && (
                    <Image
                      source={{ uri: newItemImage }}
                      style={styles.previewImage}
                    />
                  )}
                </>
              )}
              {modalMode === "addItemOrCategory" && newCategoryName && (
                <TextInput
                  style={styles.input}
                  onChangeText={setNewCategoryName}
                  value={newCategoryName}
                  placeholder="Enter new category name"
                />
              )}
              {modalMode === "update" && selectedCategory && (
                <>
                  <Picker
                    selectedValue={selectedItem}
                    onValueChange={(itemValue) => {
                      setSelectedItem(itemValue);
                      if (itemValue) {
                        const item = menu[selectedCategory].find(
                          (i) => i.id === itemValue
                        );
                        setNewItemName(item.name);
                        setNewItemImage(item.image);
                      }
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select an item" value="" />
                    {menu[selectedCategory].map((item) => (
                      <Picker.Item
                        key={item.id}
                        label={item.name}
                        value={item.id}
                      />
                    ))}
                  </Picker>
                  {selectedItem && (
                    <>
                      <TextInput
                        style={styles.input}
                        onChangeText={setNewItemName}
                        value={newItemName}
                        placeholder="Enter item name"
                      />
                      <TouchableOpacity
                        style={styles.imageButton}
                        onPress={handleImagePick}
                      >
                        <Text style={styles.buttonText}>
                          {newItemImage ? "Change Image" : "Upload Image"}
                        </Text>
                      </TouchableOpacity>
                      {newItemImage && (
                        <Image
                          source={{ uri: newItemImage }}
                          style={styles.previewImage}
                        />
                      )}
                    </>
                  )}
                </>
              )}
              {modalMode === "removeItemOrCategory" && selectedCategory && (
                <Picker
                  selectedValue={selectedItem}
                  onValueChange={setSelectedItem}
                  style={styles.picker}
                >
                  <Picker.Item
                    label="Select an item (or none to remove category)"
                    value=""
                  />
                  {menu[selectedCategory].map((item) => (
                    <Picker.Item
                      key={item.id}
                      label={item.name}
                      value={item.id}
                    />
                  ))}
                </Picker>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSave]}
                  onPress={handleSave}
                >
                  <Text style={styles.textStyle}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
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
  success: "#2ecc71",
  fabBorder: "#FFFFFF",
  error: "#FF0000",
};

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoryContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 10,
    padding: 10,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  menuItemsContainer: {
    justifyContent: "space-between",
  },
  menuItem: {
    marginBottom: 16,
    alignItems: "center",
  },
  menuItemImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
  },
  menuItemImage: {
    width: "100%",
    height: "100%",
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.primary,
  },
  modalButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  picker: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 5,
    padding: 15,
    width: "100%",
    marginBottom: 20,
    fontSize: 16,
  },
  imageButton: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  previewImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 10,
    alignSelf: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 15,
    width: "45%",
    alignItems: "center",
  },
  buttonClose: {
    backgroundColor: colors.danger,
  },
  buttonSave: {
    backgroundColor: colors.success,
  },
  textStyle: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  placeholderImage: {
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#888",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 5,
    overflow: "hidden",
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  segmentedButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentedButtonText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  segmentedButtonTextActive: {
    color: colors.text,
  },
});

export default MenuComponent;
