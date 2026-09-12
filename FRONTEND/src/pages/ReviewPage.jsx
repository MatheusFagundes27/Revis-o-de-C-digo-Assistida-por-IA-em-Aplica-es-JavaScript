import Header from "../components/Header";
import ReviewToolbar from "../components/ReviewToolbar";
import MetricsBar from "../components/MetricsBar";
import CodePanel from "../components/CodePanel";
import ResultsPanel from "../components/ResultsPanel";

import "../styles/review-page.css";

function ReviewPage() {
  return (
    <div className="app-shell">
      <Header />

      <main className="review-page">
        <ReviewToolbar />

        <MetricsBar />

        <div className="review-workspace">
          <CodePanel />

          <ResultsPanel />
        </div>
      </main>
    </div>
  );
}

export default ReviewPage;