import {
  useState,
  //  useEffect
} from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";

import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Copy, Check, Info } from "lucide-react";

dayjs.extend(customParseFormat);

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

interface CopyableCellProps {
  value: string;
  onCopy: (val: string) => void;
}

// A reusable component for the copy icon with state-based feedback.
const CopyableCell: React.FC<CopyableCellProps> = ({ value, onCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = () => {
    onCopy(value);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  return (
    <div className="flex items-center space-x-2 w-full">
      <button
        onClick={handleCopyClick}
        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
      <div className="truncate">{value}</div>
    </div>
  );
};

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [storedUser, setStoredUser] = useState<string>("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  // useEffect(() => {
  //   const savedUser = localStorage.getItem("username") || "";
  //   const savedToken = localStorage.getItem("token") || "";
  //   setStoredUser(savedUser);
  //   setUsername(savedUser);
  //   setToken(savedToken);
  // }, []);
  const fetchCommits = async () => {
    const [startDate, endDate] = dateRange;
    setError(null); // clear previous error

    if (!username || !token || !startDate || !endDate) {
      setError("Please enter username, token, and select a date range.");
      return;
    }

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

      if (!projectsResp.ok) {
        throw new Error(
          `GitLab API error: ${projectsResp.status} ${projectsResp.statusText}`
        );
      }

      const projects = await projectsResp.json();

      const allCommits: any[] = [];

      for (const project of projects) {
        const commitsResp = await fetch(
          `https://gitlab.com/api/v4/projects/${
            project.id
          }/repository/commits?since=${startDate
            .toDate()
            .toISOString()}&until=${endDate.toDate().toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!commitsResp.ok) {
          throw new Error(
            `Failed to fetch commits for project ${project.name}`
          );
        }

        const commits = await commitsResp.json();

        commits
          .filter(
            (c: any) =>
              !email || c.author_email?.toLowerCase() === email.toLowerCase()
          )
          .forEach((c: any) => {
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
    } catch (err: any) {
      console.error("Error fetching commits", err);
      setError(err.message || "Unknown error occurred while fetching commits.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    // Clear any old credentials
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("email");

    // Store new credentials
    localStorage.setItem("username", username);
    localStorage.setItem("token", token);
    localStorage.removeItem("email");

    setStoredUser(username);

    fetchCommits();
  };

  const handleCopy = (text: string) => {
    // The alert is removed and replaced by the visual feedback in the cell itself.
    navigator.clipboard.writeText(text);
  };

  const columns: GridColDef[] = [
    { field: "date", headerName: "Date", width: 150 },
    { field: "time", headerName: "Time", width: 120 },
    {
      field: "projectName",
      headerName: "Project",
      width: 200,
      renderCell: (params) => (
        <CopyableCell value={params.value as string} onCopy={handleCopy} />
      ),
    },
    {
      field: "commits",
      headerName: "Commits",
      width: 400,
      renderCell: (params) => (
        <CopyableCell value={params.value as string} onCopy={handleCopy} />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Navbar Header */}
      <header className="bg-white shadow-md py-4 px-6 fixed w-full z-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl mx-auto text-center font-bold text-gray-800">
            GitLab Commits Fetcher
          </h1>
        </div>
      </header>

      {/* Main content container */}
      <div className="p-6 pt-24 w-full max-w-5xl mx-auto space-y-8">
        {/* Loader */}
        {loading && (
          <div className="fixed inset-0 bg-gray-900/80 bg-opacity-70 flex items-center justify-center z-50 h-full">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
              <p className="text-white text-lg font-medium">
                Loading commits...
              </p>
            </div>
          </div>
        )}

        {/* User Input */}
        <div className="bg-white rounded  border border-gray-300 shadow p-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:!space-x-4">
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-52 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />

            <div className="relative flex items-center w-full md:w-40">
              <input
                type="password"
                placeholder="Private Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />

              {/* Info Tooltip */}
              <div className="group absolute right-2 cursor-pointer">
                <Info className="h-4 w-4 text-gray-500 hover:text-indigo-500" />
                <div className="absolute  right-0 bottom-0 hidden w-64 group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 shadow-lg z-50">
                  You can create a Personal Access Token from:
                  <br />
                  <strong>User → Edit Profile → Access Tokens</strong>
                  <br />
                  or visit:
                  <br />
                  <a
                    href="https://gitlab.com/-/profile/personal_access_tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-indigo-300"
                  >
                    gitlab.com/-/profile/personal_access_tokens
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md px-4 py-2 transition-colors disabled:bg-indigo-300"
            >
              Submit
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                setUsername("");
                setToken("");
                setStoredUser("");
                setRows([]);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Date Picker */}
        <div className="bg-white rounded border border-gray-300 shadow p-6 flex flex-col md:flex-row items-center !space-y-4 md:!space-y-0 md:!space-x-4">
          <div className="text-gray-700 font-medium">Select Date Range:</div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateRangePicker
              value={dateRange}
              format="DD/MM/YYYY"
              onChange={(newValue) => setDateRange(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: 250, width: "100%", maxWidth: 300 },
                },
              }}
            />
          </LocalizationProvider>
          <button
            onClick={fetchCommits}
            disabled={loading || !dateRange[0] || !dateRange[1]}
            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md px-4 py-2 transition-colors disabled:bg-gray-400"
          >
            Load Commits
          </button>
        </div>

        {/* DataGrid */}
        <div
          className="bg-white rounded border border-gray-300 shadow p-6"
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

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}
    </div>
  );
}
