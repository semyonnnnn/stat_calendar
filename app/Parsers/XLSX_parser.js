import { columns_needed } from "../utils/columns_needed.js";
import { read, utils } from "xlsx";

export class XLSX_parser {
  constructor(year) {
    this.year = year;
    this.sheetNames = []; // Stores clean month names for UI navigation
  }

  async init() {
    console.group("🚀 [XLSX_parser] Initialization Pipeline");
    this.rawJSON = await this.getRawJSON();
    console.log("📦 Total Aggregated Raw Rows:", this.rawJSON.length, this.rawJSON);

    this.sorted = await this.JSON_sorted();
    console.log("📅 Final Sorted Calendar Matrix:", this.sorted);
    console.groupEnd();
  }

  // Fuzzy matcher to clean sheet tab names into standard Russian month labels
  cleanSheetName(rawName, fallbackIndex) {
    const months = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];

    const normalized = String(rawName).toLowerCase().trim();

    const matchedIndex = months.findIndex((m) =>
      normalized.includes(m.toLowerCase())
    );

    if (matchedIndex !== -1) {
      return months[matchedIndex];
    }

    return String(rawName).trim() || `Лист ${fallbackIndex + 1}`;
  }

  async getRawJSON() {
    const isDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        (typeof process !== "undefined" && process.env?.NODE_ENV === "development"));

    const url = !isDev
      ? `https://66.rosstat.gov.ru/storage/mediabank/ded723ee-cbb4-4c81-a7d6-73f6604ead1c.xlsx`
      : `https://raw.githubusercontent.com/semyonnnnn/files/main/ded723ee-cbb4-4c81-a7d6-73f6604ead1c.xlsx`;

    console.log(`🌐 [Fetch Stage] Target URL: ${url} (isDev: ${isDev})`);

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = read(arrayBuffer, { type: "array" });

    console.log("📑 [Workbook Loaded] Raw Sheet Names:", workbook.SheetNames);

    this.sheetNames = workbook.SheetNames.map((name, idx) =>
      this.cleanSheetName(name, idx)
    );

    const aggregatedData = [];
    const aggregatedErrors = {};

    function normalize(el) {
      return String(el).toLowerCase().replace(/ё/g, "е");
    }

    // Process each sheet independently
    workbook.SheetNames.forEach((sheetName, sheetIdx) => {
      console.group(`📄 [Sheet ${sheetIdx + 1}/${workbook.SheetNames.length}] "${sheetName}"`);

      const worksheet = workbook.Sheets[sheetName];
      const sheetJson = utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      console.log(`📊 Total Raw Rows Extracted: ${sheetJson ? sheetJson.length : 0}`);

      if (!sheetJson || sheetJson.length < 2) {
        console.warn(`⚠️ Skipping sheet "${sheetName}": Sheet is empty or lacks rows (< 2).`);
        console.groupEnd();
        return;
      }

      // Dynamic header search: Scan top 10 rows for target column headers
      let headerRowIndex = -1;
      let report_date_index = -1;
      let short_name_index = -1;
      let report_range_index = -1;

      for (let i = 0; i < Math.min(sheetJson.length, 10); i++) {
        const candidateRow = sheetJson[i];
        if (!Array.isArray(candidateRow)) continue;

        const resolvedIndices = columns_needed.map((col) =>
          candidateRow.findIndex((el) => normalize(el).includes(col))
        );

        if (resolvedIndices.every((idx) => idx !== -1)) {
          headerRowIndex = i;
          [report_date_index, short_name_index, report_range_index] = resolvedIndices;
          break;
        }
      }

      // Skip non-schedule tabs gracefully without breaking execution
      if (headerRowIndex === -1) {
        console.warn(
          `⚠️ Sheet "${sheetName}" SKIPPED: Header mismatch or auxiliary reference tab.`
        );
        console.groupEnd();
        return;
      }

      const headers = sheetJson[headerRowIndex];

      console.log(`📌 Found headers on Row ${headerRowIndex + 1}:`, {
        report_date_index,
        short_name_index,
        report_range_index,
      });

      const indices_needed = [
        short_name_index,
        report_range_index,
        report_date_index,
      ];

      const noteIndex = headers.findIndex((item) =>
        normalize(item).includes("примечание")
      );

      // Extract rows starting after the detected header row, filtering out canceled items
      const dataRows = sheetJson.slice(headerRowIndex + 1).filter((row) => {
        if (noteIndex === -1) return true;
        const noteValue = String(row[noteIndex] || "");
        return !normalize(noteValue).includes("отмен");
      });

      console.log(`🧹 Active Rows (after header slice & 'отмен' exclusion): ${dataRows.length}`);

      // Map values & parse Excel serial dates
      const processedRows = dataRows.map((row, row_index) => {
        return row
          .map((cell, index) => ({
            name: `${sheetName}!${utils.encode_col(index)}${row_index + headerRowIndex + 2}`,
            value: cell !== undefined && cell !== null ? String(cell) : "",
          }))
          .filter((_, index) => indices_needed.includes(index))
          .map((cell, index) => {
            if (index === 2 && /^\d+$/.test(cell.value)) {
              const value = parseInt(cell.value, 10);
              const excelEpoch = new Date(Date.UTC(1899, 11, 30));
              const msPerDay = 24 * 60 * 60 * 1000;
              const raw_date = new Date(excelEpoch.getTime() + value * msPerDay);
              const new_value = new Intl.DateTimeFormat("ru-RU").format(raw_date);
              return { name: cell.name, value: new_value };
            }
            return cell;
          });
      });

      if (processedRows.length > 0) {
        console.log("🧪 Sample Processed Row (Index 0):", processedRows[0]);
      }

      const purgeValues = (cell, index) => {
        if (!cell.value.trim()) return false;
        if (index === 2) {
          if (!/^\d{2}\.\d{2}\.\d{4}$/.test(cell.value)) return false;
          const [day, month, year] = cell.value.split(".").map(Number);
          const date = new Date(year, month - 1, day);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
          );
        }
        return true;
      };

      const invalidRows = processedRows.filter((row) => !row.every(purgeValues));
      console.log(`❌ Invalid/Rejected Rows in Sheet: ${invalidRows.length}`);

      if (invalidRows.length > 0) {
        console.log("⚠️ Sample Rejected Row:", invalidRows[0]);
      }

      invalidRows.forEach((row) =>
        row.forEach((cell, idx) => {
          if (!cell.value.trim()) {
            aggregatedErrors[`Пустая ячейка ${cell.name}`] = `${cell.name}: [${cell.value}]`;
          } else if (idx === 2 && !/^\d{2}\.\d{2}\.\d{4}$/.test(cell.value)) {
            aggregatedErrors[`Некорректная дата ${cell.name}`] = `${cell.name}: [${cell.value}]`;
          }
        })
      );

      const validRows = processedRows
        .filter((row) => row.length === 3 && row.every(purgeValues))
        .map((row) => row.map((cell) => cell.value));

      console.log(`✅ Accepted Valid Rows: ${validRows.length}`);
      if (validRows.length > 0) {
        console.log("✨ Sample Valid Row:", validRows[0]);
      }

      aggregatedData.push(...validRows);
      console.groupEnd();
    });

    console.group("📊 [Aggregated Error Diagnostics]");
    if (Object.keys(aggregatedErrors).length === 0) {
      console.table({ "Вы молодец": ["Ошибок во всех листах Excel нет!"] });
    } else {
      console.warn("⚠️ Validation anomalies detected across sheets:");
      console.table(aggregatedErrors);
    }
    console.groupEnd();

    return aggregatedData;
  }

  async JSON_sorted() {
    const raw_json = this.rawJSON;
    console.group("🧩 [JSON_sorted] Matrix Generation");
    console.log("Input raw_json count:", raw_json ? raw_json.length : 0);

    if (!raw_json || !raw_json.length) {
      console.error("❌ raw_json is completely empty! Sorting step aborted.");
      console.groupEnd();
      return [];
    }

    const file_year = Number(raw_json[0][2]?.split(".")[2]) || this.year;
    console.log("Detected File Year:", file_year);

    const data_by_month_and_day = [
      new Array(31),
      file_year % 4 === 0 ? new Array(29) : new Array(28),
      new Array(31),
      new Array(30),
      new Array(31),
      new Array(30),
      new Array(31),
      new Array(31),
      new Array(30),
      new Array(31),
      new Array(30),
      new Array(31),
    ];

    let insertedCount = 0;
    raw_json.forEach((row, i) => {
      if (!row[2]) {
        console.warn(`Row ${i} lacks valid date string at index 2:`, row);
        return;
      }
      const day = Number(row[2].split(".")[0]) - 1;
      const month = Number(row[2].split(".")[1]) - 1;

      // Check month existence and day index within array length
      if (
        data_by_month_and_day[month] &&
        day >= 0 &&
        day < data_by_month_and_day[month].length
      ) {
        if (!data_by_month_and_day[month][day]) {
          data_by_month_and_day[month][day] = [[row[0], row[1]]];
        } else {
          data_by_month_and_day[month][day].push([row[0], row[1]]);
        }
        insertedCount++;
      } else {
        console.warn(
          `Out-of-bounds date placement: Month ${month}, Day ${day} for row:`,
          row
        );
      }
    });

    console.log(`🎯 Successfully inserted ${insertedCount} items into calendar structure.`);
    console.groupEnd();

    return data_by_month_and_day;
  }
}