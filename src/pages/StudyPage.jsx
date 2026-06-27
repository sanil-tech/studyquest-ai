import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function StudyPage() {
  const { subjectId } = useParams();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const subs = await base44.entities.Subject.list();
      setSubjects(subs);
      if (subjectId) {
        const sub = subs.find(s => s.id === subjectId);
        setSelectedSubject(sub);
        const t = await base44.entities.Topic.filter({ subject_id: subjectId });
        setTopics(t);
      }
      setLoading(false);
    };
    load();
  }, [subjectId]);

  const handleSelectSubject = async (sub) => {
    setSelectedSubject(sub);
    setLoading(true);
    const t = await base44.entities.Topic.filter({ subject_id: sub.id });
    setTopics(t);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Show subjects if none selected
  if (!selectedSubject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Choose a Subject 📚</h1>
          <p className="text-muted-foreground text-sm mt-1">What do you want to study?</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {subjects.map((sub, i) => (
            <motion.button
              key={sub.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelectSubject(sub)}
              className="p-5 rounded-2xl bg-white border-2 border-border/50 hover:border-primary/30 hover:shadow-md transition-all text-center"
            >
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
                style={{ backgroundColor: (sub.color || "#6366F1") + "15" }}
              >
                {sub.icon || "📚"}
              </div>
              <h3 className="font-heading font-semibold text-sm">{sub.name}</h3>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Show topics
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/study" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-heading font-bold flex items-center gap-2">
            {selectedSubject.icon} {selectedSubject.name}
          </h1>
          <p className="text-muted-foreground text-sm">Choose a topic to study</p>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No topics yet for this subject.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/study/${selectedSubject.id}/${topic.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border/50 hover:shadow-md hover:border-primary/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{topic.name}</h3>
                  {topic.form_level && (
                    <span className="text-xs text-muted-foreground">{topic.form_level}</span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}