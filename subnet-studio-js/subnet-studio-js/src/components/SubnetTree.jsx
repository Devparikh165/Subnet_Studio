import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ipToLong, longToIp, getNetworkDetails } from '../lib/iputils';
export function SubnetTree({
  originalIp,
  originalCidr,
  targetCidr
}) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  // Generate the binary tree of subnets
  const buildTree = (ip, cidr, target) => {
    if (cidr === target) {
      return {
        name: `${getNetworkDetails(ip, cidr).network}/${cidr}`,
        cidr
      };
    }

    // Split this subnet into two
    const details = getNetworkDetails(ip, cidr);
    const networkLong = ipToLong(details.network);
    const nextCidr = cidr + 1;
    const hostsPerNextSubnet = Math.pow(2, 32 - nextCidr);
    const leftIp = longToIp(networkLong);
    const rightIp = longToIp(networkLong + hostsPerNextSubnet >>> 0);
    return {
      name: `${details.network}/${cidr}`,
      cidr,
      children: [buildTree(leftIp, nextCidr, target), buildTree(rightIp, nextCidr, target)]
    };
  };
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return;
    if (targetCidr <= originalCidr || targetCidr > originalCidr + 8) return; // Limit depth

    const rootData = buildTree(originalIp, originalCidr, targetCidr);
    const width = wrapperRef.current.clientWidth || 800;
    // Calculate required height based on leaf count to prevent squishing
    const leafCount = Math.pow(2, targetCidr - originalCidr);
    const height = Math.max(400, leafCount * 30);
    const margin = {
      top: 20,
      right: 120,
      bottom: 20,
      left: 120
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height).attr("viewBox", [0, 0, width, height]);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const treeLayout = d3.tree().size([innerHeight, innerWidth]);
    const root = d3.hierarchy(rootData);
    treeLayout(root);

    // Links
    g.selectAll(".link").data(root.links()).join("path").attr("class", "link").attr("fill", "none").attr("stroke", "#52525b") // zinc-600
    .attr("stroke-width", 1.5).attr("stroke-opacity", 0.4).attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

    // Nodes
    const node = g.selectAll(".node").data(root.descendants()).join("g").attr("class", "node").attr("transform", d => `translate(${d.y},${d.x})`);
    node.append("circle").attr("r", 4).attr("fill", d => d.children ? "#38bdf8" : "#34d399") // sky-400 : emerald-400
    .attr("stroke", d => d.children ? "#0284c7" : "#059669").attr("stroke-width", 1.5);
    node.append("text").attr("dy", "0.31em").attr("x", d => d.children ? -8 : 8).attr("text-anchor", d => d.children ? "end" : "start").text(d => d.data.name).attr("fill", "currentColor").attr("font-size", "11px").attr("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace").attr("class", "text-zinc-600 dark:text-zinc-400");
  }, [originalIp, originalCidr, targetCidr]);
  if (targetCidr <= originalCidr || targetCidr > originalCidr + 8) {
    return null;
  }
  return <div className="w-full mt-6" ref={wrapperRef}>
      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Network Tree Visualization</h4>
      <div className="w-full overflow-x-auto overflow-y-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 scrollbar-hide max-h-[500px]">
        <svg ref={svgRef} className="min-w-full text-zinc-800 dark:text-zinc-200" />
      </div>
    </div>;
}
