// Shared between the browser (window.EcoFlowShared) and the API (require("../shared.js")).
(function (root) {
  // photo: path to a picture in photos/, e.g. "photos/ramzi.jpg" (leave "" to show initials)
  const members = [
    { name: "Ramzi", ceo: true, role: "CEO · Leader & Technical Project Manager", desc: "Coordinates the team, keeps the project on track, and manages the technical side of the solutions.", focus: "Leadership", initials: "RA", color: "#234c39", photo: "" },
    { name: "Daniel", role: "System Thinking & Project Management", desc: "Connects the big picture, identifies dependencies, and keeps plans organized and realistic.", focus: "Strategy", initials: "D", color: "#3979c9", photo: "" },
    { name: "Connor", role: "Website Design Specialist & Project Manager", desc: "Designs and maintains the website and helps manage project timelines and deliverables.", focus: "Digital", initials: "C", color: "#6d50b5", photo: "" },
    { name: "Brook", role: "Project Design Lead", desc: "Leads the overall project design and makes sure solutions are practical, innovative, and impactful.", focus: "Design", initials: "B", color: "#df5666", photo: "" },
    { name: "Feras", role: "Co-Project Design Lead", desc: "Supports the design process and brings creative ideas to prototypes and testing.", focus: "Prototyping", initials: "F", color: "#e97a27", photo: "" },
    { name: "Andreas", role: "Communications and Promotions Manager", desc: "Coordinates outreach, promotes the campaign, and communicates impact to partners and the community.", focus: "Outreach", initials: "A", color: "#238c83", photo: "" },
    { name: "Kajus", role: "Senior Communications Specialist", desc: "Creates clear content, supports media, and keeps the campaign message consistent across channels.", focus: "Content", initials: "K", color: "#4546b7", photo: "" }
  ];

  const milestoneNames = ["Research & planning", "School outreach", "Household bin system", "Prototype development", "Government presentation"];
  const priorities = ["Normal", "High", "Urgent"];
  const statuses = ["On track", "Need help", "Deadline at risk", "Completed this week"];

  const starterTasks = [
    { title: "Confirm project goals and success criteria", owner: "Daniel", milestone: 0, priority: "High", definition: "The team agrees on measurable outcomes." },
    { title: "Organize school outreach shortlist", owner: "Andreas", milestone: 1, priority: "High", definition: "Potential schools and contact routes are recorded." },
    { title: "Draft household bin system concept", owner: "Brook", milestone: 2, priority: "Normal", definition: "A concept sketch and sorting logic are documented." },
    { title: "Review prototype requirements", owner: "Feras", milestone: 3, priority: "Normal", definition: "Materials, safety considerations, and test criteria are listed." },
    { title: "Maintain campaign website and project tracker", owner: "Connor", milestone: 0, priority: "Normal", definition: "Project information is current and easy to navigate." },
    { title: "Coordinate technical project workflow", owner: "Ramzi", milestone: 3, priority: "High", definition: "Owners, dependencies, and next decisions are documented." },
    { title: "Prepare campaign messaging and content plan", owner: "Kajus", milestone: 1, priority: "Normal", definition: "A consistent message and content calendar are drafted." }
  ].map((t, i) => ({ id: "starter" + (i + 1), due: "", done: false, created: i + 1, ...t }));

  const shared = { members, milestoneNames, priorities, statuses, starterTasks };
  if (typeof module === "object" && module.exports) module.exports = shared;
  else root.EcoFlowShared = shared;
})(typeof globalThis !== "undefined" ? globalThis : this);
