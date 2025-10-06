import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QueryAnswer() {
  const [location] = useLocation();
  const id = location.split("/")[3];
  const [query, setQuery] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5001/api/query/${id}`)
      .then(res => res.json())
      .then(setQuery);
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`http://localhost:5001/api/query/${id}/answer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    setSubmitted(true);
  };

  if (!query) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary dark:text-blue-300">Answer Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-gray-900 dark:text-gray-100"><b>Name:</b> {query.name}</div>
            <div className="mb-2 text-gray-900 dark:text-gray-100"><b>Email:</b> {query.email}</div>
            <div className="mb-4 text-gray-900 dark:text-gray-100"><b>Query:</b> {query.message}</div>
            <form onSubmit={handleSubmit}>
              <textarea
                className="w-full border rounded p-2 mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Type your answer here..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                required
                rows={5}
              />
              <Button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded"
              >
                Submit
              </Button>
            </form>
            {submitted && (
              <div className="mt-4 text-green-600 dark:text-green-400 font-semibold">
                Answer submitted and email sent!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}