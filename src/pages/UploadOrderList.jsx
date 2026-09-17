// import { useEffect, useState } from 'react';
// import Papa from 'papaparse';
// import { toast } from 'react-toastify';
// import {
//   FiUpload,
//   FiCheckCircle,
//   FiClock,
//   FiSend,
//   FiLoader,
//   FiAlertTriangle,
//   FiPauseCircle,
//   FiXCircle,
//   FiUserX,
//   FiSlash,
// } from 'react-icons/fi';
// import { createOrdersBulk } from '../api/orders.api';
// import { fetchBlacklistedCustomers } from '../api/customers.api';
// import { HIGH_VALUE_COD_THRESHOLD, PENDING_REASONS } from '../constants';
// import { useExpiredPaymentOrders } from '../hooks/useExpiredPaymentOrdres';

// const REQUIRED_COLUMNS = [
//   'Name', // Order ID
//   'Id', // Numeric Shopify Id, matched against blacklisted customer_id
//   'Email',
//   'Billing Name',
//   'Lineitem sku', // Style Number
//   'Lineitem quantity',
//   'Financial Status',
//   'Payment Method',
//   'Tags',
//   'Created at',
//   'Billing Phone',
//   'Shipping Method',
//   'Total', // Order value, used for the >5000 rule
//   'Source', // shopify_draft_order etc.
// ];

// const formatDate = (dateString) => {
//   if (!dateString) return new Date().toISOString();
//   const date = new Date(dateString);
//   return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
// };

// const extractSize = (sku) => {
//   if (!sku) return '';
//   const parts = sku.split('-');
//   let sizePart = parts[parts.length - 1].toUpperCase();
//   if (sizePart === 'XXL' || sizePart === '2XL') return '2XL';
//   if (sizePart === 'XXXL' || sizePart === '3XL') return '3XL';
//   return sizePart;
// };

// const buildOrderPayload = (order) => {
//   const financialStatus = (order['Financial Status'] || '').toLowerCase();
//   const paymentMethod = (order['Payment Method'] || '').toLowerCase();
//   const isPrepaid =
//     financialStatus === 'paid' ||
//     financialStatus === 'partially_paid' ||
//     paymentMethod.includes('gateway') ||
//     paymentMethod.includes('razorpay') ||
//     paymentMethod.includes('upi');

//   return {
//     order_id: order['Name'],
//     customer_id: Number(order['Id']) || undefined,
//     customer_email: order['Email'] || '',
//     customer_name: order['Billing Name'] || '',
//     styleNumber: Number(order['Lineitem sku']?.split('-')[0]) || 0,
//     size: extractSize(order['Lineitem sku']),
//     quantity: Number(order['Lineitem quantity']) || 0,
//     price: parseFloat(order['Total']) || 0,
//     order_date: formatDate(order['Created at']),
//     shipping_method: order['Shipping Method'] || 'NA',
//     payment_method: order['Payment Method'] || 'NA',
//     payment_type: isPrepaid ? 'Prepaid' : 'COD',
//     payment_status: order['Financial Status'] || 'NA',
//     order_status: order['Tags'] || 'NA',
//     contact_number: order['Billing Phone']?.toString() || 'NA',
//     source: order['Source'] || 'manual',
//   };
// };

// const isValidPayload = (p) => p.order_id && p.styleNumber && p.size && p.quantity;

// // Maps the human-readable reasons shown on screen to the fixed set of
// // values the backend's pending_reason field accepts. Anything not
// // recognised (e.g. the "Shopify Draft Order" note) is dropped from the
// // saved reason list but still shows up in the on-screen "Reason" column.
// const canonicalizePendingReasons = (reasons) => {
//   const mapped = reasons.map((r) => {
//     if (r === PENDING_REASONS.BAD_ADDRESS) return r;
//     if (r === PENDING_REASONS.HIGH_RTO) return r;
//     if (r === PENDING_REASONS.MEDIUM_RTO) return r;
//     if (r === 'Not Confirmed') return r;
//     if (r.startsWith('Confirmed but amount exceeds')) return PENDING_REASONS.HIGH_VALUE_COD;
//     return null;
//   });
//   const unique = [...new Set(mapped.filter(Boolean))];
//   return unique.length > 0 ? unique : ['Not Confirmed'];
// };

// // Central place that decides what bucket an order belongs to and why.
// // category: 'precancelled' | 'pending' | 'confirmed' | 'blacklisted'
// //
// // UPDATED LOGIC:
// // 1. Blacklisted -> Blacklisted Orders (highest priority)
// // 2. Cancelled -> PreCancelled
// // 3. IF order is PAID (Financial Status = 'paid') -> ALWAYS Confirmed
// //    (regardless of RTO tags, bad address, or high value)
// // 4. IF order is NOT PAID -> Check for RTO/Bad Address tags
// //    - Has RTO/Bad Address tags -> Pending with reasons
// //    - No RTO/Bad Address tags -> Pending with "Not Confirmed" reason
// const classifyOrder = (row, blacklistedCustomerIds) => {
//   const tagsLower = (row['Tags'] || '').toLowerCase();
//   const financialStatus = (row['Financial Status'] || '').toLowerCase();
//   const source = (row['Source'] || '').toLowerCase();
//   const orderNumericId = Number(row['Id']) || 0;
//   const total = parseFloat(row['Total']) || 0;

//   const isDraftOrder = source === 'shopify_draft_order';
//   const isCancelled = tagsLower.includes('cancelled');
//   const isHighRto = tagsLower.includes('high rto risk');
//   const isMediumRto = tagsLower.includes('medium rto risk');
//   const isBadAddress = tagsLower.includes('bad address');
//   const isBlacklisted = orderNumericId > 0 && blacklistedCustomerIds.has(orderNumericId);

//   const isPaid = financialStatus === 'paid';
//   const isHighValue = total > HIGH_VALUE_COD_THRESHOLD;

//   const flags = {
//     isHighRto,
//     isMediumRto,
//     isBadAddress,
//     isPaid,
//     isHighValue,
//     isDraftOrder,
//     isBlacklisted,
//     isCancelled,
//   };
//   const draftNote = isDraftOrder ? ['Shopify Draft Order (also sent to Hold)'] : [];

//   // Priority 0: blacklisted customer -> ALWAYS BLACKLISTED ORDERS
//   if (isBlacklisted) {
//     return {
//       category: 'blacklisted',
//       reasons: ['Blacklisted Customer', ...draftNote],
//       flags,
//     };
//   }

//   // Priority 1: cancelled tag -> precancelled
//   if (isCancelled) {
//     return { category: 'precancelled', reasons: ['Cancelled', ...draftNote], flags };
//   }

//   // Priority 2: IF ORDER IS PAID -> ALWAYS CONFIRMED
//   // Regardless of RTO tags, bad address, or high value
//   if (isPaid) {
//     const reasons = [...draftNote];
//     // Add notes about tags for visibility but they stay in confirmed
//     if (isHighRto) reasons.push('High RTO Risk (Note: Order is Paid)');
//     if (isMediumRto) reasons.push('Medium RTO Risk (Note: Order is Paid)');
//     if (isBadAddress) reasons.push('Bad Address (Note: Order is Paid)');
//     if (isHighValue)
//       reasons.push(`Amount exceeds ₹${HIGH_VALUE_COD_THRESHOLD} (Note: Order is Paid)`);
//     return { category: 'confirmed', reasons, flags };
//   }

//   // Priority 3: NOT PAID - Check for RTO / Bad Address tags
//   const forcedReasons = [];
//   if (isHighRto) forcedReasons.push(PENDING_REASONS.HIGH_RTO);
//   if (isMediumRto) forcedReasons.push(PENDING_REASONS.MEDIUM_RTO);
//   if (isBadAddress) forcedReasons.push(PENDING_REASONS.BAD_ADDRESS);

//   if (forcedReasons.length > 0) {
//     return { category: 'pending', reasons: [...forcedReasons, ...draftNote], flags };
//   }

//   // Priority 4: NOT PAID and no RTO/Bad Address tags -> Pending with "Not Confirmed"
//   return { category: 'pending', reasons: ['Not Confirmed', ...draftNote], flags };
// };

// const categoryBadge = (category) => {
//   const map = {
//     confirmed: 'bg-green-100 text-green-800',
//     pending: 'bg-yellow-100 text-yellow-800',
//     precancelled: 'bg-red-100 text-red-800',
//     hold: 'bg-purple-100 text-purple-800',
//     blacklisted: 'bg-gray-800 text-white',
//   };
//   const label = {
//     confirmed: 'Confirmed',
//     pending: 'Pending',
//     precancelled: 'PreCancelled',
//     hold: 'Hold',
//     blacklisted: 'Blacklisted',
//   };
//   return (
//     <span className={`px-2 py-1 text-xs rounded-full ${map[category]}`}>{label[category]}</span>
//   );
// };

// const UploadOrdersPage = () => {
//   const [data, setData] = useState([]);
//   const [voidedRows, setVoidedRows] = useState([]);
//   const [blacklistedCustomerIds, setBlacklistedCustomerIds] = useState(new Set());
//   const [error, setError] = useState('');
//   const [sending, setSending] = useState(false);
//   const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
//   const [paymentPendingOrderIds, setPaymentPendingOrderIds] = useState([]);

//   const { loading, error: expiredOrderError, expiredPaymentOrders } = useExpiredPaymentOrders();

//   const storePendingIds = () => {
//     const transformed = expiredPaymentOrders.map((o) => o.name);
//     setPaymentPendingOrderIds(transformed);
//   };

//   // Load the full blacklist once so every uploaded order can be checked
//   // locally as a first pass, matching by numeric customer_id (the "Id"
//   // column). The backend re-validates this on save too, so an order can
//   // never slip through even if this list is stale.
//   useEffect(() => {
//     const fetchBlacklist = async () => {
//       try {
//         const data = await fetchBlacklistedCustomers({ limit: 100000 });
//         const ids = new Set(
//           (data.customers || [])
//             .map((c) => Number(c.customer_id))
//             .filter((id) => !isNaN(id) && id > 0)
//         );
//         setBlacklistedCustomerIds(ids);
//         if (expiredPaymentOrders.length > 0) {
//           storePendingIds();
//           console.log('ids', paymentPendingOrderIds);
//         }
//       } catch (err) {
//         console.error('Failed to load blacklist:', err.response?.data || err.message);
//       }
//     };
//     fetchBlacklist();
//   }, [expiredPaymentOrders]);

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setError('');
//     setData([]);
//     setVoidedRows([]);
//     setProgress({ total: 0, completed: 0, percentage: 0 });

//     if (!file.name.endsWith('.csv')) {
//       setError('Please upload a valid CSV file.');
//       return;
//     }

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (results) => {
//         if (results.errors.length > 0) {
//           setError('Error parsing CSV file.');
//           return;
//         }

//         // Step 1: Group rows by Order ID. Orders with multiple line items
//         // (multiple SKUs under the same order) produce multiple rows here --
//         // every single one of them is kept and saved, none are deduped.
//         const groupedOrders = {};
//         results.data.forEach((row) => {
//           const orderId = row['Name'];
//           if (!groupedOrders[orderId]) groupedOrders[orderId] = [];
//           groupedOrders[orderId].push(row);
//         });

//         const finalData = [];

//         // Step 2: Normalize each group
//         Object.values(groupedOrders).forEach((orderGroup) => {
//           const baseRow = orderGroup.find(
//             (row) =>
//               row['Financial Status'] ||
//               row['Billing Phone'] ||
//               row['Tags'] ||
//               row['Shipping Method'] ||
//               row['Total'] ||
//               row['Source'] ||
//               row['Id'] ||
//               row['Email'] ||
//               row['Billing Name']
//           );

//           const commonFields = {
//             'Financial Status': baseRow?.['Financial Status'] || 'NA',
//             'Billing Phone': baseRow?.['Billing Phone']?.toString() || 'NA',
//             'Billing Name': baseRow?.['Billing Name'] || '',
//             Tags: baseRow?.['Tags'] || 'NA',
//             'Shipping Method': baseRow?.['Shipping Method'] || 'NA',
//             'Payment Method': baseRow?.['Payment Method'] || 'NA',
//             Total: baseRow?.['Total'] || '0',
//             Source: baseRow?.['Source'] || 'NA',
//             Id: baseRow?.['Id'] || '',
//             Email: baseRow?.['Email'] || '',
//           };

//           // Step 3: Fill missing values in each row
//           orderGroup.forEach((row) => {
//             const filteredRow = {};
//             REQUIRED_COLUMNS.forEach((col) => {
//               filteredRow[col] = Object.keys(commonFields).includes(col)
//                 ? commonFields[col]
//                 : row[col] || '';
//             });
//             finalData.push(filteredRow);
//           });
//         });

//         const filteredData = finalData.filter(
//           (d) => d['Financial Status']?.toLowerCase() !== 'voided'
//         );
//         const voided = finalData.filter((d) => d['Financial Status']?.toLowerCase() === 'voided');

//         setData(filteredData);
//         setVoidedRows(voided);
//       },
//       error: (err) => setError('Error reading file: ' + err.message),
//     });
//   };

//   // Classifies the whole dataset once so the summary cards, table and
//   // sendOrdersToBackend all agree on the same numbers.
//   const classifyAll = (rows) => {
//     const buckets = {
//       precancelled: [],
//       pending: [],
//       confirmed: [],
//       draftOrders: [],
//       blacklisted: [], // New bucket for blacklisted orders
//     };
//     const counts = {
//       confirmed: 0,
//       pending: 0,
//       precancelled: 0,
//       hold: 0,
//       blacklisted: 0,
//       confirmedButBadAddress: 0,
//       highRtoRisk: 0,
//       mediumRtoRisk: 0,
//       paidWithIssues: 0,
//     };

//     rows.forEach((row) => {
//       const result = classifyOrder(row, blacklistedCustomerIds);
//       const enrichedRow = { ...row, __reasons: result.reasons };
//       buckets[result.category].push(enrichedRow);

//       // Only increment if category exists in counts
//       if (result.category in counts) {
//         counts[result.category] += 1;
//       }

//       if (result.flags?.isDraftOrder) {
//         buckets.draftOrders.push(enrichedRow);
//         counts.hold += 1;
//       }
//       if (result.flags?.isHighRto) counts.highRtoRisk += 1;
//       if (result.flags?.isMediumRto) counts.mediumRtoRisk += 1;
//       if (result.flags?.isBlacklisted) counts.blacklisted += 1;
//       if (
//         result.flags?.isPaid &&
//         (result.flags?.isBadAddress ||
//           result.flags?.isHighRto ||
//           result.flags?.isMediumRto ||
//           result.flags?.isHighValue)
//       ) {
//         counts.paidWithIssues += 1;
//       }
//       if (result.flags?.isPaid && result.flags?.isBadAddress) {
//         counts.confirmedButBadAddress += 1;
//       }
//     });

//     return { buckets, counts };
//   };

//   const { counts } = classifyAll(data);

//   const bumpProgress = () =>
//     setProgress((prev) => {
//       const completed = prev.completed + 1;
//       return { ...prev, completed, percentage: Math.round((completed / prev.total) * 100) };
//     });

//   const sendOrdersToBackend = async () => {
//     if (data.length === 0 && voidedRows.length === 0) {
//       setError('No data to send');
//       return;
//     }

//     setSending(true);
//     setError('');

//     const { buckets } = classifyAll(data);

//     // Jobs array - now includes blacklisted as a separate resource
//     const jobs = [
//       { resource: 'confirmed', rows: buckets.confirmed.map(buildOrderPayload), label: 'confirmed' },
//       {
//         resource: 'pending',
//         rows: buckets.pending.map((o) => ({
//           ...buildOrderPayload(o),
//           pending_reason: canonicalizePendingReasons(o.__reasons),
//         })),
//         label: 'pending',
//       },
//       {
//         resource: 'pre-cancelled',
//         rows: buckets.precancelled.map((o) => ({
//           ...buildOrderPayload(o),
//           cancel_reason: o.__reasons.join(', '),
//         })),
//         label: 'pre-cancelled',
//       },
//       {
//         resource: 'blacklisted',
//         rows: buckets.blacklisted.map((o) => ({
//           ...buildOrderPayload(o),
//           blacklist_reason: o.__reasons.join(', '),
//         })),
//         label: 'blacklisted',
//       },
//       {
//         resource: 'hold',
//         rows: buckets.draftOrders.map((o) => ({
//           ...buildOrderPayload(o),
//           source: o['Source'] || 'shopify_draft_order',
//         })),
//         label: 'hold',
//       },
//       {
//         resource: 'voided',
//         rows: voidedRows.map((o) => ({
//           ...buildOrderPayload(o),
//           void_reason: 'Voided in Shopify',
//         })),
//         label: 'voided',
//       },
//     ].filter((job) => job.rows.filter(isValidPayload).length > 0);

//     setProgress({ total: jobs.length || 1, completed: 0, percentage: 0 });

//     const summaryMessages = [];
//     for (const job of jobs) {
//       const validRows = job.rows.filter(isValidPayload);
//       try {
//         const res = await createOrdersBulk(job.resource, validRows);
//         summaryMessages.push(`${validRows.length} ${job.label}`);
//         if (res.data?.blacklistedCount) {
//           summaryMessages.push(`${res.data.blacklistedCount} auto-redirected to blacklisted`);
//         }
//       } catch (err) {
//         console.error(`Failed to send ${job.label}:`, err.response?.data || err.message);
//         toast.error(
//           `Failed to process ${job.label} orders: ${err.response?.data?.message || err.message}`
//         );
//       } finally {
//         bumpProgress();
//       }
//     }

//     toast.success(`Processed: ${summaryMessages.join(', ')}.`);
//     setSending(false);
//     setData([]);
//     setVoidedRows([]);
//   };

//   if (loading) return <p>loading..</p>;
//   return (
//     <div className="max-w-5xl mx-auto">
//       <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Orders</h1>

//       <div className="bg-white rounded-lg shadow p-6 mb-6">
//         <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-blue-500 transition-colors">
//           <FiUpload className="text-3xl text-blue-500 mb-3" />
//           <span className="text-lg font-medium text-gray-700">Upload Orders CSV</span>
//           <span className="text-sm text-gray-500 mt-1">Shopify order export (.csv)</span>
//           <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
//         </label>
//       </div>

//       {error && (
//         <div className="p-4 mb-6 rounded-lg bg-red-100 text-red-800 border-l-4 border-red-500">
//           {error}
//         </div>
//       )}

//       {sending && (
//         <div className="mb-6 bg-white p-4 rounded-lg shadow">
//           <div className="flex justify-between items-center mb-2">
//             <span className="text-sm font-medium text-gray-700">
//               Processing... ({progress.completed}/{progress.total})
//             </span>
//             <span className="text-sm font-medium text-gray-700">{progress.percentage}%</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2.5">
//             <div
//               className="bg-blue-600 h-2.5 rounded-full"
//               style={{ width: `${progress.percentage}%` }}
//             />
//           </div>
//         </div>
//       )}

//       {(data.length > 0 || voidedRows.length > 0) && (
//         <>
//           <div className="bg-white rounded-lg shadow p-6 mb-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg font-semibold text-gray-700">
//                 Order Summary ({data.length + voidedRows.length} total)
//               </h2>
//               <button
//                 onClick={sendOrdersToBackend}
//                 disabled={sending}
//                 className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
//               >
//                 {sending ? (
//                   <>
//                     <FiLoader className="animate-spin mr-2" /> Processing...
//                   </>
//                 ) : (
//                   <>
//                     <FiSend className="mr-2" /> Process Orders
//                   </>
//                 )}
//               </button>
//             </div>

//             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//               <div className="bg-green-50 p-4 rounded-lg flex flex-col justify-center items-center border border-green-200">
//                 <div className="flex items-center gap-1">
//                   <FiCheckCircle className="text-green-600" />
//                   <span className="font-medium">Confirmed</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-green-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.confirmed}
//                 </p>
//               </div>

//               <div className="bg-yellow-50 p-4 rounded-lg flex flex-col justify-center items-center border border-yellow-200">
//                 <div className="flex items-center gap-1">
//                   <FiClock className="text-yellow-600" />
//                   <span className="font-medium">Pending</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-orange-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.pending}
//                 </p>
//               </div>

//               <div className="bg-red-50 p-4 rounded-lg flex flex-col justify-center items-center border border-red-200">
//                 <div className="flex items-center gap-1">
//                   <FiXCircle className="text-red-600" />
//                   <span className="font-medium">PreCancelled</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-red-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.precancelled}
//                 </p>
//               </div>

//               <div className="bg-gray-800 p-4 flex flex-col justify-center items-center rounded-lg border border-gray-900">
//                 <div className="flex items-center gap-1">
//                   <FiUserX className="text-white" />
//                   <span className="font-medium text-white">Blacklisted</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-white w-12 h-12 grid items-center text-center rounded-full text-white">
//                   {counts.blacklisted}
//                 </p>
//               </div>

//               <div className="bg-red-400 p-4 flex flex-col justify-center items-center rounded-lg border border-red-200">
//                 <div className="flex items-center gap-1">
//                   <FiSlash className="text-white" />
//                   <span className="font-medium text-white">Voided</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-white w-12 h-12 grid items-center text-center rounded-full text-white">
//                   {voidedRows.length}
//                 </p>
//               </div>

//               <div className="bg-orange-50 p-4 rounded-lg flex flex-col justify-center items-center border border-orange-200">
//                 <div className="flex items-center gap-1">
//                   <FiAlertTriangle className="text-orange-600" />
//                   <span className="font-medium text-center text-sm">Confirmed + Bad Address</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-orange-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.confirmedButBadAddress}
//                 </p>
//               </div>

//               <div className="bg-rose-50 p-4 rounded-lg flex flex-col justify-center items-center border border-rose-200">
//                 <div className="flex items-center gap-1">
//                   <FiAlertTriangle className="text-rose-600" />
//                   <span className="font-medium">High RTO Risk</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-rose-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.highRtoRisk}
//                 </p>
//               </div>

//               <div className="bg-amber-50 p-4 rounded-lg flex flex-col justify-center items-center border border-amber-200">
//                 <div className="flex items-center gap-1">
//                   <FiAlertTriangle className="text-amber-600" />
//                   <span className="font-medium">Medium RTO Risk</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-amber-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.mediumRtoRisk}
//                 </p>
//               </div>

//               <div className="bg-purple-50 p-4 rounded-lg flex flex-col justify-center items-center border border-purple-200">
//                 <div className="flex items-center gap-1">
//                   <FiPauseCircle className="text-purple-600" />
//                   <span className="font-medium">Hold (Draft)</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-purple-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.hold}
//                 </p>
//               </div>

//               <div className="bg-blue-50 p-4 flex flex-col justify-center items-center rounded-lg border border-blue-200 col-span-1">
//                 <div className="flex items-center gap-1">
//                   <FiCheckCircle className="text-blue-600" />
//                   <span className="font-medium text-center text-sm">Paid with Issues</span>
//                 </div>
//                 <p className="text-2xl font-bold mt-2 border-2 border-blue-600 w-12 h-12 grid items-center text-center rounded-full">
//                   {counts.paidWithIssues}
//                 </p>
//                 <span className="text-xs text-gray-500 mt-1">(In Confirmed)</span>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-lg shadow overflow-hidden">
//             <div className="overflow-x-auto h-[50vh]">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50 sticky top-0">
//                   <tr>
//                     {['Order ID', 'SKU', 'Qty', 'Total', 'Payment', 'Status', 'Reason'].map((h) => (
//                       <th
//                         key={h}
//                         className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {data.map((row, idx) => {
//                     const { category, reasons } = classifyOrder(row, blacklistedCustomerIds);
//                     return (
//                       <tr key={idx} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                           {row['Name']}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {row['Lineitem sku']}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {row['Lineitem quantity']}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           ₹{row['Total']}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {row['Payment Method']}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">{categoryBadge(category)}</td>
//                         <td className="px-6 py-4 text-xs text-gray-500">
//                           {reasons.length > 0 ? reasons.join(', ') : '—'}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default UploadOrdersPage;
