// holidayPolicyColumns.ts

export const holidayPolicyColumns = [
  {
    field: "id",
    headerName: "ID",
    className: "min-w-[80px]",
  },
  {
    field: "leave_name",
    headerName: "Leave Name",
    className: "min-w-[150px]",
  },
  {
    field: "description",
    headerName: "Description",
    className: "min-w-[200px]",
  },
  {
    field: "policy_applied_to",
    headerName: "Policy Applied TO",
    className: "min-w-[100px] text-center",
    headerClassName: "text-center",
    render: (value: boolean) => (value ? value: "-"),

  },
  {
    field: "type_id",
    headerName: "Type Id",
    className: "min-w-[120px] text-center",
    headerClassName: "text-center",
    render: (value: boolean) => (value ? value: "-"),

  },
  {
    field: "global",
    headerName: "Global",
    className: "min-w-[80px] text-center",
    headerClassName: "text-center",
    render: (value: boolean) => (value ? "Yes" : "No"),
  },
  {
    field: "total_days",
    headerName: "Total Days",
    className: "min-w-[100px] text-right",
    headerClassName: "text-right",
  },
  {
    field: "max_contiguous",
    headerName: "Max Contiguous",
    className: "min-w-[130px] text-right",
    headerClassName: "text-right",
  },
  {
    field: "day_of_week",
    headerName: "Day of Week",
    className: "min-w-[130px]",
    render: (value: boolean) => (value ? value: "-"),

  },
  {
    field: "effective_date",
    headerName: "Effective Date",
    className: "min-w-[130px]",
    render: (value: string | Date) =>
      new Date(value).toLocaleDateString("en-GB"),
  },
  {
    field: "expiry_date",
    headerName: "Expiry Date",
    className: "min-w-[130px]",
    render: (value: string | Date) =>
      new Date(value).toLocaleDateString("en-GB"),
  },
  {
    field: "policy_frequency",
    headerName: "Policy Frequency",
    className: "min-w-[130px]",
    render: (value: boolean) => (value ? value: "Recurring"),

  },
  {
    field: "carry_forward",
    headerName: "Carry Forward",
    className: "min-w-[100px] text-center",
    headerClassName: "text-center",
    render: (value: boolean) => (value ? "Yes" : "No"),
  },
  // {
  //   field: "created_at",
  //   headerName: "Created At",
  //   className: "min-w-[160px]",
  //   render: (value: string | Date) =>
  //     new Date(value).toLocaleString("en-GB"),
  // },
  // {
  //   field: "updated_at",
  //   headerName: "Updated At",
  //   className: "min-w-[160px]",
  //   render: (value: string | Date) =>
  //     new Date(value).toLocaleString("en-GB"),
  // },
];
