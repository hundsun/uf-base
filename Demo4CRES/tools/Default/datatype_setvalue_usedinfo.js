/************************************************************
 *** JSfile   : datatype_setvalue_usedinfo.js
 *** Author   : zhuyf
 *** Date     : 2013-6-14
 *** Notes    : 该用户脚本用于批量设置业务数据类型列表使用情况信息
 *这里使用到的属性，是通过扩展属性设置的(isused,used_detail),使用该脚本之前，请先设置好扩展属性
 *设置方法参考用户手册。
 ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="数据类型列表使用情况信息";//说明信息

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var typeInfo = project.getMetadataInfoByType("datatype");// 业务数据类型资源
		typeInfo.becomeWorkingCopy();//资源信息转换为可写对象
		var datatypes = typeInfo.getItems();// 数据类型条目
		var usedMap = analyseStdFieldList();//分析哪些数据类型已被使用，在一个Map中存储已使用的数据类型名称
		if (datatypes.length > 0) {
		for(var i in datatypes) {
			var datatype = datatypes[i];//数据类型对象
			var type_name = datatype.getName();//数据类型名称
			if(usedMap.containsKey(type_name)){//如果在Map中存在，则已被使用
				datatype.setExtendsValue("isused","true");//使用状态设置为已使用，该属性为用户扩展属性，在项目属性/用户属性扩展中配置
				var used_info = usedMap.get(type_name);//使用说明信息，返回一个List
				//使用说明详细信息
				var used_detail = type_name + "在标准字段 " + used_info + " 中使用过。\r\n";
				datatype.setExtendsValue("used_detail",used_detail);//该属性为用户扩展属性，在项目属性/用户属性扩展中配置
			}else{
				datatype.setExtendsValue("isused","false");//该类型未使用
				datatype.setExtendsValue("used_detail",type_name + "未在标准字段中使用");
			}
		}
		typeInfo.save();//使用情况分析结果信息保存
		output.dialog("数据类型使用情况已分析，结果信息已保存，可通过打开业务数据类型编辑器查看！");
		output.info("数据类型使用情况已分析，结果信息已保存，可通过打开业务数据类型编辑器查看！");
		}else{
			output.dialog("业务数据类型为空，无法设置使用信息！");
			output.info("业务数据类型为空，无法设置使用信息！");
		}
	}

	/**
	 * 分析哪些数据类型已经在标准字段中使用
	 * 返回分析结果，为Map结构，key为数据类型名称，value为List，一项对应一个标准字段
	 */
	function analyseStdFieldList() {
		var usedMap = stringutil.getMap();
		var stdInfo = project.getMetadataInfoByType("stdfield");// 标准字段资源
		var stdflds = stdInfo.getItems();// 标准字段条目
		for(var i in stdflds){
			var stdfld = stdflds[i];
			var stdfld_name = stdfld.getName();//标准字段名称
			output.info("正在分析标准字段[" + stdfld_name + "]");
			var stdfld_chinesename = stdfld.getChineseName();//标准字段中文名
			var datatype = stdfld.getBizDataType();//标准字段条目对应的业务数据类型
			if(datatype != null){
				var datatype_name = datatype.getName();//标准字段条目对应的业务数据类型名称
				if(usedMap.containsKey(datatype_name)){
					usedMap.get(datatype_name).add(stdfld_name + "-" + stdfld_chinesename);
				}else{
					var stdList = stringutil.getList();
					stdList.add(stdfld_name + "-" + stdfld_chinesename);
					usedMap.put(datatype_name,stdList);
				}
			}
		}
		return usedMap;
	}