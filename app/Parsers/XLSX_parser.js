import { columns_needed } from "../utils/columns_needed.js";

import { read, utils } from "xlsx";
// const { read, utils } = XLSX;

export class XLSX_parser {
  constructor(year) {
    this.year = year;
  }

  async init() {
    this.rawJSON = await this.getRawJSON();
    this.sorted = await this.JSON_sorted();
  }

  isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development");

  async getRawJSON() {
    const url = this.isDev
      ? `https://raw.githubusercontent.com/semyonnnnn/files/main/stat_calendar_${this.year}.xlsx`
      : `https://66.rosstat.gov.ru/storage/mediabank/stat_calendar_${this.year}_test.xlsx`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = read(arrayBuffer, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const json = utils
      .sheet_to_json(worksheet, { header: 1, defval: "" })
      .map((row) => {
        return row.map((cell) => {
          if (cell !== undefined || cell !== null) {
            return cell.toString();
          } else {
            return "";
          }
        });
      });

    const headers = json[0];

    function normalize(el) {
      return el.toLowerCase().replace(/ё/g, "е");
    }

    const [report_date_index, short_name_index, report_range_index] =
      columns_needed.map((col) => {
        return headers.findIndex((el) => normalize(el).includes(col));
      });

    const indices_needed = [
      short_name_index,
      report_range_index,
      report_date_index,
    ];

    const no_canceled = json.filter((row, index, arr) => {
      if (
        row[
          json[0].findIndex((item) =>
            item.trim().toLowerCase().includes("примечание")
          )
        ]
          .trim()
          .toLowerCase()
          .includes("отмен")
      ) {
        return false;
      } else {
        return true;
      }
    });
    const min_json = no_canceled.map((row, row_index) => {
      return row
        .map((cell, index) => ({
          name: `${utils.encode_col(index)}.${row_index + 1}`,
          value: cell,
        }))
        .filter((cell, index) => indices_needed.includes(index))
        .map((cell, index) => {
          if (index === 2 && /^\d+$/.test(cell.value)) {
            const value = parseInt(cell.value, 10);
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const msPerDay = 24 * 60 * 60 * 1000;
            const raw_date = new Date(excelEpoch.getTime() + value * msPerDay);
            const new_value = new Intl.DateTimeFormat("ru-RU").format(raw_date);
            return { name: cell.name, value: new_value };
          } else {
            return cell;
          }
        });
    });

    const purgeValues = (cell, index) => {
      if (!cell.value.trim()) {
        return false;
      } else if (index === 2) {
        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(cell.value)) {
          return false;
        } else {
          const [day, month, year] = cell.value.split(".").map(Number);
          const date = new Date(year, month - 1, day);
          if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
          ) {
            return false;
          } else {
            return true;
          }
        }
      } else {
        return true;
      }
    };

    const no_error_rows_json = min_json.filter((row) => row.every(purgeValues));

    const only_error_rows_json = min_json.filter(
      (row) => !row.every(purgeValues)
    );

    const errors_json = [];
    if (Object.keys(only_error_rows_json).length === 0) {
      errors_json["Вы молодец"] = ["Ошибок в Excel файле нет!"];
    } else {
      only_error_rows_json.slice(1).forEach((row) =>
        row.forEach((cell, index) => {
          const value = cell.value;
          const name = cell.name;

          if (!value.trim()) {
            errors_json[`Пустая ячейка ${name}`] = `${name}: [${value}]`;
          } else {
            if (index === 2) {
              if (!/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
                errors_json[
                  `Образец даты ${name}: <dd.mm.yyyy>`
                ] = `${name}: [${value}]`;
              } else {
                const [day, month, year] = cell.value.split(".").map(Number);
                const date = new Date(year, month - 1, day);
                if (
                  date.getFullYear() !== year ||
                  date.getMonth() !== month - 1 ||
                  date.getDate() !== day
                ) {
                  errors_json[
                    `Образец даты ${name}: <dd.mm.yyyy>`
                  ] = `${name}: [${value}]`;
                }
              }
            }
          }
        })
      );
    }

    console.table(errors_json);

    const no_excel_json = no_error_rows_json.map((row) =>
      row.map((cell) => cell.value)
    );

    return no_excel_json;
  }

  async JSON_sorted() {
    const raw_json = this.rawJSON;
    const file_year = Number(raw_json[0][2].split(".")[2]);

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

    raw_json.forEach((row) => {
      const day = Number(row[2].split(".")[0]) - 1;
      const month = Number(row[2].split(".")[1]) - 1;

      if (!data_by_month_and_day[month][day]) {
        data_by_month_and_day[month][day] = [[row[0], row[1]]];
      } else {
        data_by_month_and_day[month][day].push([row[0], row[1]]);
      }
    });

    return data_by_month_and_day;
  }
}
