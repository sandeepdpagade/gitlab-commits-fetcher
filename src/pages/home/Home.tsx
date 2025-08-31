import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;

interface RowData {
  id: number;
  date: string;
  time: string;
  projectName: string;
  commits: string;
}

const indianDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [storedUser, setStoredUser] = useState<string>("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("username") || "";
    const savedToken = localStorage.getItem("token") || "";
    setStoredUser(savedUser);
    setUsername(savedUser);
    setToken(savedToken);
  }, []);

  const fetchCommits = async () => {
    if (!username || !token || !startDate || !endDate) return;

    setLoading(true);
    try {
      const projectsResp = await fetch(
        "https://gitlab.com/api/v4/projects?membership=true",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const projects = await projectsResp.json();

      const allCommits: any[] = [];

      for (const project of projects) {
        const commitsResp = await fetch(
          `https://gitlab.com/api/v4/projects/${
            project.id
          }/repository/commits?since=${startDate.toISOString()}&until=${endDate.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const commits = await commitsResp.json();

        commits.forEach((c: any) => {
          const commitDate = new Date(c.created_at);
          allCommits.push({
            date: indianDateFormatter.format(commitDate),
            time: commitDate.toISOString().split("T")[1].slice(0, 5),
            projectName: project.name,
            commit: c.title,
          });
        });
      }

      const grouped: Record<string, any> = {};
      allCommits.forEach((item) => {
        const key = `${item.date}-${item.projectName}`;
        if (!grouped[key]) {
          grouped[key] = {
            date: item.date,
            time: item.time,
            projectName: item.projectName,
            commits: [item.commit],
          };
        } else {
          grouped[key].commits.push(item.commit);
        }
      });

      const formattedRows: RowData[] = Object.values(grouped).map(
        (g: any, i: number) => ({
          id: i + 1,
          date: g.date,
          time: g.time,
          projectName: g.projectName,
          commits: g.commits.join(", "),
        })
      );

      setRows(formattedRows);
    } catch (err) {
      console.error("Error fetching commits", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    localStorage.setItem("username", username);
    localStorage.setItem("token", token);
    setStoredUser(username);
    fetchCommits();
  };

  const handleCopy = (row: RowData) => {
    const textToCopy = `${row.projectName}: ${row.commits}`;
    navigator.clipboard.writeText(textToCopy);
    alert("Copied to clipboard!");
  };

  const handleDateChange: RangePickerProps["onChange"] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setStartDate(dates[0].toDate());
      setEndDate(dates[1].toDate());
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const columns: GridColDef[] = [
    { field: "date", headerName: "Date (DD/MM/YYYY)", flex: 1 },
    { field: "time", headerName: "Time", flex: 1 },
    { field: "projectName", headerName: "Project", flex: 1.5 },
    { field: "commits", headerName: "Commits", flex: 3 },
    {
      field: "copy",
      headerName: "Copy",
      flex: 0.5,
      renderCell: (params) => (
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md px-3 py-1 text-sm font-medium transition-colors"
          onClick={() => handleCopy(params.row as RowData)}
        >
          Copy
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar Header */}
      <header className="bg-white shadow-md py-4 px-6 fixed  w-full z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl mx-auto text-center font-bold text-gray-800">
            GitLab Commits Fetcher
          </h1>
        </div>
      </header>

      {/* Main content container with top padding to prevent overlap with the fixed header */}
      <div className="p-6 pt-24 w-full max-w-5xl mx-auto space-y-8">
        {/* Full-screen loader overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
              <p className="text-white text-lg font-medium">
                Loading commits...
              </p>
            </div>
          </div>
        )}

        {/* Top Bar - Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:!space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Hello{" "}
            <span className="text-indigo-600">{storedUser || "Guest"}</span> 👋
          </h2>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-40 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <input
              type="password"
              placeholder="Private Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-40 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md px-4 py-2 transition-colors disabled:bg-indigo-300"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Date Picker and Load Button */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center !space-y-4 md:space-y-0 md:!space-x-4">
          <label className="text-gray-700 font-medium">
            Select Date Range:
          </label>
          <RangePicker
            onChange={handleDateChange}
            format="DD/MM/YYYY"
            className="w-full md:w-auto ant-range-picker-custom"
          />
          <button
            onClick={fetchCommits}
            disabled={loading || !startDate || !endDate}
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md px-4 py-2 transition-colors disabled:bg-gray-400"
          >
            Load Commits
          </button>
        </div>

        {/* DataGrid Container */}
        <div
          className="bg-white rounded-xl shadow-lg p-6"
          style={{ height: 600, width: "100%" }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 20]}
            disableRowSelectionOnClick
            className="mui-datagrid-custom"
          />
        </div>
      </div>
    </div>
  );
}
