import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

const StockComponent = ({ stock, setStock }) => {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(0);
  const [tempQuantity, setTempQuantity] = useState("");
  const intervalRef = useRef(null);

  const StockItem = React.memo(
    ({
      category,
      item,
      count,
      startEditing,
      editingItem,
      tempQuantity,
      updateQuantity,
      confirmQuantity,
    }) => {
      return (
        <View key={item} style={styles.itemContainer}>
          <View style={styles.itemNameContainer}>
            <Text style={styles.itemName}>{item}</Text>
            {editingItem &&
            editingItem.category === category &&
            editingItem.item === item ? (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(-1)}
                  onLongPress={() => startContinuousUpdate(-1)}
                  onPressOut={stopContinuousUpdate}
                >
                  <AntDesign name="minus" color={colors.text} size={20} />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={tempQuantity}
                  onChangeText={(text) => {
                    if (/^\d*$/.test(text)) {
                      setTempQuantity(text);
                    } else {
                      Alert.alert(
                        "Invalid Input",
                        "Please enter numbers only."
                      );
                    }
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={confirmQuantity}
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(1)}
                  onLongPress={() => startContinuousUpdate(1)}
                  onPressOut={stopContinuousUpdate}
                >
                  <AntDesign name="plus" color={colors.text} size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmQuantity}
                >
                  <MaterialIcons name="check" color={colors.white} size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.countContainer}
                onPress={() => startEditing(category, item)}
              >
                <Text style={styles.countText}>{count}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }
  );

  const addItem = () => {
    if (
      newItemCategory.trim() !== "" &&
      newItemName.trim() !== "" &&
      newItemQuantity.trim() !== ""
    ) {
      const quantity = parseInt(newItemQuantity, 10);
      if (isNaN(quantity)) {
        Alert.alert(
          "Invalid Input",
          "Please enter a valid number for quantity."
        );
        return;
      }
      setStock((prevStock) => ({
        ...prevStock,
        [newItemCategory]: {
          ...prevStock[newItemCategory],
          [newItemName.trim()]: Math.min(quantity, 500),
        },
      }));
      setNewItemCategory("");
      setNewItemName("");
      setNewItemQuantity("");
      setAddModalVisible(false);
    }
  };

  const removeItems = () => {
    const updatedStock = { ...stock };
    Object.entries(selectedItems).forEach(([category, items]) => {
      Object.entries(items).forEach(([item, isSelected]) => {
        if (isSelected) {
          delete updatedStock[category][item];
        }
      });
      if (Object.keys(updatedStock[category]).length === 0) {
        delete updatedStock[category];
      }
    });
    setStock(updatedStock);
    setSelectedItems({});
    setRemoveModalVisible(false);
  };

  const startEditing = (category, item) => {
    setEditingItem({ category, item });
    setEditingQuantity(stock[category][item]);
    setTempQuantity(stock[category][item].toString());
  };

  const stopEditing = () => {
    setEditingItem(null);
    setTempQuantity("");
    clearInterval(intervalRef.current);
  };

  const updateQuantity = (increment) => {
    setEditingQuantity((prevQuantity) => {
      const newQuantity = prevQuantity + increment;
      setTempQuantity(Math.max(0, Math.min(newQuantity, 500)).toString());
      return Math.max(0, Math.min(newQuantity, 500));
    });
  };

  const confirmQuantity = () => {
    if (editingItem) {
      const newQuantity = Math.max(
        0,
        Math.min(parseInt(tempQuantity, 10) || 0, 500)
      );
      setStock((prevStock) => ({
        ...prevStock,
        [editingItem.category]: {
          ...prevStock[editingItem.category],
          [editingItem.item]: newQuantity,
        },
      }));
      setEditingQuantity(newQuantity);
      stopEditing();
    }
  };

  const startContinuousUpdate = (increment) => {
    updateQuantity(increment);
    intervalRef.current = setInterval(() => updateQuantity(increment), 100);
  };

  const stopContinuousUpdate = () => {
    clearInterval(intervalRef.current);
  };

  const addCategory = () => {
    if (newCategory.trim() !== "") {
      setStock((prevStock) => ({
        ...prevStock,
        [newCategory.trim()]: {},
      }));
      setNewCategory("");
      setAddCategoryModalVisible(false);
    }
  };

  const renderStockItem = ({ item: [category, items] }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{category}</Text>
      {Object.entries(items).map(([itemName, count]) => (
        <StockItem
          key={itemName}
          category={category}
          item={itemName}
          count={count}
          startEditing={startEditing}
          editingItem={editingItem}
          tempQuantity={tempQuantity}
          updateQuantity={updateQuantity}
          confirmQuantity={confirmQuantity}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={Object.entries(stock)}
        renderItem={renderStockItem}
        keyExtractor={([category]) => category}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => setAddModalVisible(true)}
        >
          <Feather name="coffee" color={colors.white} size={24} />
          <Text style={styles.actionButtonText}>Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addCategoryButton]}
          onPress={() => setAddCategoryModalVisible(true)}
        >
          <Feather name="folder-plus" color={colors.white} size={24} />
          <Text style={styles.actionButtonText}>Add Category</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => setRemoveModalVisible(true)}
        >
          <Feather name="trash-2" color={colors.white} size={24} />
          <Text style={styles.actionButtonText}>Remove Items</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <Picker
              selectedValue={newItemCategory}
              onValueChange={(itemValue) => setNewItemCategory(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a category" value="" />
              {Object.keys(stock).map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
            <TextInput
              style={styles.input}
              onChangeText={setNewItemName}
              value={newItemName}
              placeholder="Enter item name"
              placeholderTextColor={colors.placeholderText}
            />
            <TextInput
              style={styles.input}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) {
                  setNewItemQuantity(text);
                } else {
                  Alert.alert("Invalid Input", "Please enter numbers only.");
                }
              }}
              value={newItemQuantity}
              placeholder="Enter quantity"
              placeholderTextColor={colors.placeholderText}
              keyboardType="number-pad"
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={addItem}
              >
                <Text style={styles.textStyle}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Remove Items Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={removeModalVisible}
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Remove Items</Text>
            <ScrollView style={styles.removeItemsScrollView}>
              <FlatList
                data={Object.entries(stock)}
                renderItem={({ item: [category, items] }) => (
                  <View>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    {Object.keys(items).map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.checkboxContainer}
                        onPress={() => {
                          setSelectedItems((prev) => ({
                            ...prev,
                            [category]: {
                              ...prev[category],
                              [item]: !prev[category]?.[item],
                            },
                          }));
                        }}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedItems[category]?.[item] &&
                              styles.checkboxChecked,
                          ]}
                        >
                          {selectedItems[category]?.[item] && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.checkboxTitle}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                keyExtractor={([category]) => category}
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setRemoveModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={removeItems}
              >
                <Text style={styles.textStyle}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addCategoryModalVisible}
        onRequestClose={() => setAddCategoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TextInput
              style={styles.input}
              onChangeText={setNewCategory}
              value={newCategory}
              placeholder="Enter category name"
              placeholderTextColor={colors.placeholderText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setAddCategoryModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={addCategory}
              >
                <Text style={styles.textStyle}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get("window");
const buttonWidth = Math.min(width * 0.8, 300);

const colors = {
  primary: "#6F4E37",
  secondary: "#C4A484",
  background: "#FFF8E7",
  text: "#3C2F2F",
  accent: "#FFDB58",
  white: "#FFFFFF",
  danger: "#e74c3c",
  success: "#2ecc71",
  info: "#3498db",
  fabBackground: "#FF4081",
  border: "#D2B48C",
  placeholderText: "#999999",
  addCategory: "#4CAF50", // New color for the Add Category button
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  categoryContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
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
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  itemNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    color: colors.text,
    flex: 1,
  },
  countContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    padding: 8,
    backgroundColor: colors.secondary,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.success,
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  actionButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addCategoryButton: {
    backgroundColor: colors.addCategory,
  },
  removeButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 5,
    padding: 15,
    width: "100%",
    marginBottom: 20,
    fontSize: 16,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    width: buttonWidth / 2 - 10,
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
    textAlign: "center",
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxTitle: {
    fontSize: 16,
    color: colors.text,
  },
  picker: {
    width: "100%",
    color: colors.text,
    marginBottom: 20,
  },
  removeItemsScrollView: {
    maxHeight: 300,
    width: "100%",
  },
});

export default StockComponent;
