import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import SubmissionTracker from "@/features/submissions/SubmissionTracker";

vi.mock("../../services/submissionService", () => ({
  getUserManuscripts: vi.fn(), createManuscript: vi.fn(), deleteManuscript: vi.fn(),
  addSubmission: vi.fn(), deleteSubmission: vi.fn(), addStatusHistory: vi.fn(),
}));
vi.mock("../../services/journalSearchService", () => ({ getJournalById: vi.fn() }));
vi.mock("../../services/favoriteService", () => ({ toggleFavorite: vi.fn() }));
vi.mock("../../components/common/JournalPicker", () => ({ default: () => <div data-testid="journal-picker" /> }));
vi.mock("../../components/common/journalPickerUtils", () => ({ isCustomJournal: () => false }));
vi.mock("../../components/common/JournalInfoCard", () => ({ default: ({ journal }: any) => <div data-testid="journal-info-card">{journal?.name}</div> }));

import { getUserManuscripts, createManuscript, deleteManuscript } from "../../services/submissionService";

const mockManuscripts = [
  {
    id: 1, userId: "u1", title: "测试论文A", currentStatus: "submitted",
    submissions: [{
      id: 10, userId: "u1", manuscriptId: 1, journalId: "j1", journalName: "Nature",
      submissionDate: "2024-01-01", status: "under_review",
      journal: { journalId: "j1", name: "Nature", title: "Nature" },
      statusHistory: [
        { id: 100, submissionId: 10, status: "submitted", date: "2024-01-01", note: "Init", createdAt: "2024-01-01" },
        { id: 101, submissionId: 10, status: "under_review", date: "2024-01-15", note: "Review", createdAt: "2024-01-15" },
      ],
      createdAt: "2024-01-01", updatedAt: "2024-01-15",
    }],
    createdAt: "2024-01-01", updatedAt: "2024-01-15",
  },
  {
    id: 2, userId: "u1", title: "测试论文B", currentStatus: "accepted",
    submissions: [], createdAt: "2024-02-01", updatedAt: "2024-02-01",
  },
];

const renderComponent = () => render(<BrowserRouter><SubmissionTracker /></BrowserRouter>);

describe("SubmissionTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
    (getUserManuscripts as Mock).mockResolvedValue(mockManuscripts);
  });

  it("shows loading", () => {
    (getUserManuscripts as Mock).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText("加载中...")).toBeInTheDocument();
  });

  it("renders list", async () => {
    renderComponent();
    await waitFor(() => { expect(screen.getByText("测试论文A")).toBeInTheDocument(); });
    expect(screen.getByText("测试论文B")).toBeInTheDocument();
  });

  it("shows header", async () => {
    renderComponent();
    await waitFor(() => { expect(screen.getByText("我的投稿记录")).toBeInTheDocument(); });
    expect(screen.getByText("新增稿件")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    (getUserManuscripts as Mock).mockResolvedValue([]);
    renderComponent();
    await waitFor(() => { expect(screen.getByText(/还没有投稿记录/)).toBeInTheDocument(); });
  });

  it("shows submission count", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("1 次投稿")).toBeInTheDocument();
      expect(screen.getByText("0 次投稿")).toBeInTheDocument();
    });
  });

  it("expands manuscript", async () => {
    renderComponent();
    await waitFor(() => { expect(screen.getByText("测试论文A")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("测试论文A"));
    await waitFor(() => { expect(screen.getByText("转投其他期刊")).toBeInTheDocument(); });
  });

  it("opens create modal", async () => {
    const user = userEvent.setup();
    renderComponent();
    await waitFor(() => { expect(screen.getByText("新增稿件")).toBeInTheDocument(); });
    await user.click(screen.getByText("新增稿件"));
    expect(screen.getByText("稿件标题 *")).toBeInTheDocument();
  });

  it("creates manuscript", async () => {
    const user = userEvent.setup();
    (createManuscript as Mock).mockResolvedValue({ id: 3 });
    renderComponent();
    await waitFor(() => { expect(screen.getByText("新增稿件")).toBeInTheDocument(); });
    await user.click(screen.getByText("新增稿件"));
    await user.type(screen.getByPlaceholderText("输入你的论文标题"), "New Paper");
    await user.click(screen.getByText("创建稿件"));
    await waitFor(() => { expect(createManuscript).toHaveBeenCalled(); });
  });

  it("disables create with empty title", async () => {
    const user = userEvent.setup();
    renderComponent();
    await waitFor(() => { expect(screen.getByText("新增稿件")).toBeInTheDocument(); });
    await user.click(screen.getByText("新增稿件"));
    expect(screen.getByText("创建稿件")).toBeDisabled();
  });

  it("closes create modal", async () => {
    const user = userEvent.setup();
    renderComponent();
    await waitFor(() => { expect(screen.getByText("新增稿件")).toBeInTheDocument(); });
    await user.click(screen.getByText("新增稿件"));
    await user.click(screen.getByText("取消"));
    await waitFor(() => { expect(screen.queryByText("稿件标题 *")).not.toBeInTheDocument(); });
  });

  it("deletes manuscript", async () => {
    (deleteManuscript as Mock).mockResolvedValue(undefined);
    renderComponent();
    await waitFor(() => { expect(screen.getByText("测试论文A")).toBeInTheDocument(); });
    const deleteButtons = screen.getAllByTitle("删除稿件");
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => { expect(deleteManuscript).toHaveBeenCalledWith(1); });
  });

  it("shows timeline on expand", async () => {
    renderComponent();
    await waitFor(() => { expect(screen.getByText("测试论文A")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("测试论文A"));
    await waitFor(() => { expect(screen.getByText("Nature")).toBeInTheDocument(); });
  });

  it("shows empty submissions", async () => {
    renderComponent();
    await waitFor(() => { expect(screen.getByText("测试论文B")).toBeInTheDocument(); });
    fireEvent.click(screen.getByText("测试论文B"));
    await waitFor(() => { expect(screen.getByText(/暂无投稿记录/)).toBeInTheDocument(); });
  });

  it("shows custom status toggle", async () => {
    const user = userEvent.setup();
    renderComponent();
    await waitFor(() => { expect(screen.getByText("新增稿件")).toBeInTheDocument(); });
    await user.click(screen.getByText("新增稿件"));
    expect(screen.getByText("自定义")).toBeInTheDocument();
    await user.click(screen.getByText("自定义"));
    expect(screen.getByPlaceholderText("输入自定义状态")).toBeInTheDocument();
  });

  it("has close button", async () => {
    const user = userEvent.setup();
    renderComponent();
    await waitFor(() => { expect(screen.getByText("新增稿件")).toBeInTheDocument(); });
    await user.click(screen.getByText("新增稿件"));
    expect(screen.getByLabelText("关闭")).toBeInTheDocument();
  });
});
