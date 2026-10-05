const TableWrapper = ({ children }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[36rem] break-keep">{children}</table>
    </div>
  )
}

export default TableWrapper
