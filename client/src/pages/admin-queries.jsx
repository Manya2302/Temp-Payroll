import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/layout/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminQueries() {
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/query")
      .then(res => res.json())
      .then(setQueries);
  }, []);

  const handleIgnore = async (id) => {
    await fetch(`http://localhost:5000/api/query/${id}/ignore`, { method: "PATCH" });
    setQueries(qs => qs.map(q => q._id === id ? { ...q, ignored: true, status: "Ignored" } : q));
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">All Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-2 px-4 border-b">Query No</th>
                    <th className="py-2 px-4 border-b">Name</th>
                    <th className="py-2 px-4 border-b">Email</th>
                    <th className="py-2 px-4 border-b">Phone number</th>
                    <th className="py-2 px-4 border-b">Query</th>
                    <th className="py-2 px-4 border-b">Status</th>
                    <th className="py-2 px-4 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((q, i) => (
                    <tr key={q._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-center">{i + 1}</td>
                      <td className="py-2 px-4 border-b">{q.name}</td>
                      <td className="py-2 px-4 border-b">{q.email}</td>
                      <td className="py-2 px-4 border-b">{q.mobile}</td>
                      <td className="py-2 px-4 border-b">{q.message}</td>
                      <td className="py-2 px-4 border-b text-center">
                        <span className={
                          q.ignored
                            ? "px-2 py-1 rounded bg-gray-300 text-gray-700 text-xs"
                            : q.replied
                            ? "px-2 py-1 rounded bg-green-100 text-green-700 text-xs"
                            : "px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs"
                        }>
                          {q.ignored
                            ? "Ignored"
                            : q.replied
                            ? "Replied"
                            : "Not Replied"}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        {!q.ignored && (
                          <div className="flex gap-2 justify-center">
                            <Link href={`/admin/query/${q._id}/answer`}>
                              <Button className="bg-primary text-white hover:bg-primary/90 px-3 py-1 rounded">
                                Answer
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-3 py-1 rounded"
                              onClick={() => handleIgnore(q._id)}
                            >
                              Ignore
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {queries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-gray-500">
                        No queries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}