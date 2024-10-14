import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

const ChartWrapper = ({ children, ...props }) => {
  if (Platform.OS === "web") {
    return (
      <View {...props}>
        {React.cloneElement(children, {
          onDataPointClick: undefined,
          getDotProps: undefined,
          onStartShouldSetResponder: undefined,
          onTouchStart: undefined,
          onTouchMove: undefined,
        })}
      </View>
    );
  }
  return children;
};

const SalesReportGenerator = ({ purchaseHistory, updatePurchaseHistory }) => {
  const [reportType, setReportType] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateSalesData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const salesData = {};
      if (!Array.isArray(purchaseHistory) || purchaseHistory.length === 0) {
        throw new Error("Invalid or empty purchase history");
      }
      purchaseHistory.forEach((purchase) => {
        if (
          !purchase.date ||
          !purchase.total ||
          !Array.isArray(purchase.items)
        ) {
          throw new Error("Invalid purchase data structure");
        }
        const date = new Date(purchase.date);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date in purchase history");
        }
        date.setHours(0, 0, 0, 0);
        let key;
        if (reportType === "daily") {
          key = date.toISOString().split("T")[0];
        } else if (reportType === "weekly") {
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
          const weekNumber = Math.ceil(
            (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
          );
          key = `${date.getFullYear()}-W${weekNumber
            .toString()
            .padStart(2, "0")}`;
        } else {
          key = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
        }

        if (!salesData[key]) {
          salesData[key] = { total: 0, itemsSold: {} };
        }
        salesData[key].total += purchase.total;

        purchase.items.forEach((item) => {
          if (!item.name || typeof item.quantity !== "number") {
            throw new Error("Invalid item data in purchase");
          }
          if (!salesData[key].itemsSold[item.name]) {
            salesData[key].itemsSold[item.name] = 0;
          }
          salesData[key].itemsSold[item.name] += item.quantity;
        });
      });
      return salesData;
    } catch (err) {
      setError(`Error processing sales data: ${err.message}`);
      return {};
    } finally {
      setIsLoading(false);
    }
  }, [purchaseHistory, reportType]);

  const salesData = useMemo(() => calculateSalesData(), [calculateSalesData]);

  const formatDate = (dateString) => {
    try {
      if (reportType === "weekly") {
        const [year, week] = dateString.split("-W");
        return `Week ${week}, ${year}`;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return reportType === "daily"
        ? date.toLocaleDateString()
        : date.toLocaleString("default", { month: "short", year: "numeric" });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid Date";
    }
  };

  const chartData = useMemo(() => {
    try {
      const labels = Object.keys(salesData).slice(-7);
      const data = labels.map((label) => salesData[label]?.total || 0);
      return {
        labels: labels.map(formatDate),
        datasets: [{ data }],
      };
    } catch (err) {
      setError(`Error generating chart data: ${err.message}`);
      return { labels: [], datasets: [{ data: [] }] };
    }
  }, [salesData, reportType]);

  const bestSellingItems = useMemo(() => {
    try {
      const itemTotals = {};
      Object.values(salesData).forEach((data) => {
        Object.entries(data.itemsSold).forEach(([item, quantity]) => {
          if (!itemTotals[item]) {
            itemTotals[item] = 0;
          }
          itemTotals[item] += quantity;
        });
      });
      return Object.entries(itemTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    } catch (err) {
      setError(`Error calculating best-selling items: ${err.message}`);
      return [];
    }
  }, [salesData]);

  const totalRevenue = useMemo(() => {
    try {
      return Object.values(salesData).reduce((sum, data) => {
        if (typeof data.total !== "number") {
          throw new Error("Invalid total in sales data");
        }
        return sum + data.total;
      }, 0);
    } catch (err) {
      setError(`Error calculating total revenue: ${err.message}`);
      return 0;
    }
  }, [salesData]);

  const averageOrderValue = useMemo(() => {
    try {
      const totalOrders = purchaseHistory.length;
      if (totalOrders === 0) {
        return 0;
      }
      if (typeof totalRevenue !== "number") {
        throw new Error("Invalid total revenue");
      }
      return totalRevenue / totalOrders;
    } catch (err) {
      setError(`Error calculating average order value: ${err.message}`);
      return 0;
    }
  }, [totalRevenue, purchaseHistory]);

  const generateReport = async (format) => {
    setIsLoading(true);
    setError(null);
    try {
      let content = "";
      const header = "Date | Order ID | Customer Name | Total\n";
      const separator = "-".repeat(header.length) + "\n";

      if (format === "csv") {
        content = "Date,Order ID,Customer Name,Total\n";
        purchaseHistory.forEach((purchase) => {
          const date = new Date(purchase.date).toISOString().split("T")[0];
          content += `${date},${purchase.orderNumber},${
            purchase.customerName
          },${purchase.total.toFixed(2)}\n`;
        });
        content += `\nTotal Revenue,,,${totalRevenue.toFixed(2)}\n`;
      } else {
        content = "Sales Report\n\n";
        content += header + separator;
        purchaseHistory.forEach((purchase) => {
          const date = new Date(purchase.date).toISOString().split("T")[0];
          content += `${date.padEnd(10)} | ${purchase.orderNumber.padEnd(
            8
          )} | ${purchase.customerName.padEnd(20)} | ₱${purchase.total
            .toFixed(2)
            .padStart(10)}\n`;
        });
        content += separator;
        content += `Total Revenue:${" ".repeat(44)}₱${totalRevenue
          .toFixed(2)
          .padStart(10)}\n`;
      }

      const fileName = `sales_report_${
        new Date().toISOString().split("T")[0]
      }.${format}`;

      if (Platform.OS === "web") {
        const blob = new Blob([content], { type: "text/plain" });
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert("Success", "Report generated and downloaded successfully.");
      } else {
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        } else {
          Alert.alert(
            "File Saved",
            "Report saved locally as sharing is not available."
          );
        }
      }
    } catch (error) {
      console.error("Error generating or sharing report:", error);
      setError(`Failed to generate report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const importDataFromCSV = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

      if (result.type === "success") {
        const fileContent = await FileSystem.readAsStringAsync(result.uri);
        const rows = fileContent.split("\n").slice(1); // Skip header

        const importedOrders = rows.map((row) => {
          const [date, orderNumber, customerName, total] = row.split(",");
          if (
            !date ||
            !orderNumber ||
            !customerName ||
            isNaN(parseFloat(total))
          ) {
            throw new Error("Invalid CSV data format");
          }
          return {
            date,
            orderNumber,
            customerName,
            total: parseFloat(total),
            items: [], // You might want to adjust this based on your data structure
          };
        });

        const updatedPurchaseHistory = [...purchaseHistory, ...importedOrders];
        updatePurchaseHistory(updatedPurchaseHistory);
        Alert.alert("Success", "Data imported successfully.");
      } else {
        console.log("Document picker cancelled or failed");
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      setError(`Failed to import CSV file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(111, 78, 55, ${opacity})`,
    strokeWidth: 2,
    propsForLabels: {
      fontSize: 10,
    },
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sales Report</Text>

      <View style={styles.reportTypeContainer}>
        {["daily", "weekly", "monthly"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.reportTypeButton,
              reportType === type && styles.activeReportType,
            ]}
            onPress={() => setReportType(type)}
          >
            <Text style={styles.reportTypeText}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6F4E37" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : !purchaseHistory || purchaseHistory.length === 0 ? (
        <Text style={styles.errorText}>No purchase history data available</Text>
      ) : (
        <>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              Total Revenue: ₱{totalRevenue.toFixed(2)}
            </Text>
            <Text style={styles.summaryText}>
              Average Order Value: ₱{averageOrderValue.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <ChartWrapper style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={Dimensions.get("window").width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </ChartWrapper>

          <Text style={styles.sectionTitle}>Best Selling Items</Text>
          <ChartWrapper style={styles.chartContainer}>
            <BarChart
              data={{
                labels: bestSellingItems.map(([item]) =>
                  item.length > 10 ? item.slice(0, 7) + "..." : item
                ),
                datasets: [
                  {
                    data: bestSellingItems.map(([, quantity]) => quantity),
                  },
                ],
              }}
              width={Dimensions.get("window").width - 40}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              verticalLabelRotation={30}
            />
          </ChartWrapper>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => generateReport("csv")}
            >
              <Text style={styles.buttonText}>Generate CSV Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => generateReport("txt")}
            >
              <Text style={styles.buttonText}>Generate Text Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={importDataFromCSV}>
              <Text style={styles.buttonText}>Import Data from CSV</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  reportTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  reportTypeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    flex: 1,
    marginHorizontal: 5,
  },
  activeReportType: {
    backgroundColor: "#6F4E37",
  },
  reportTypeText: {
    color: "#000",
    textAlign: "center",
  },
  summaryContainer: {
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  buttonContainer: {
    marginTop: 15,
  },
  button: {
    backgroundColor: "#6F4E37",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default React.memo(SalesReportGenerator);
