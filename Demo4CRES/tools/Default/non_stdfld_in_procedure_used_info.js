/************************************************************
 *** JSfile   : non_stdfld_in_procedure_used_info.js
 *** Author   : qinyuan
 *** Date     : 2014-05-05
 *** Notes    : 该用户脚本用于分析非标准字段在存储过程的输入输出参数中使用情况
 ************************************************************/

	/**用户变量定义区，允许用户自行修改*/

	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="非标准字段在存储过程的输入输出参数中使用情况汇总";//说明，默认选项值，可通过context.get方法获取用户选项值进行替换。

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var infoBuffer = stringutil.getStringBuffer();
		var cFileName = "nonStdFldInProcedure.txt"; //文件名
		var file_path = fileOutputLocation + "\\" + cFileName;
		
		infoBuffer.append(stringutil.getCHeadFileHeader(cFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
		
		var procedures = project.getProcedures();
		if(procedures.length > 0){
			for(var i in procedures){
				var procedure = procedures[i];
				//输入参数
				var inparams = procedure.getInputParameters();
				for(var k in inparams){
					var param = inparams[k];
					var paramType = param.getParamType(); 	//参数类型
					if(paramType == "NON_STD_FIELD"){	//非标准字段
						infoBuffer.append("过程【" + procedure.getName() + "】的输入参数【" + param.getName() + "】为非标准字段")
						infoBuffer.append("\r\n");  //用fixLength函数补齐空格对齐
					}
				}
				//输出参数
				var outparams = procedure.getOutputParameters();
				for(var k in outparams){
					var param = outparams[k];
					var paramType = param.getParamType(); 	//参数类型
					if(paramType == "NON_STD_FIELD"){	//非标准字段
						infoBuffer.append("过程【" + procedure.getName() + "】的输出参数【" + param.getName() + "】为非标准字段")
						infoBuffer.append("\r\n");  //用fixLength函数补齐空格对齐
					}
				}
			}
			
			file.write(file_path, infoBuffer ,charset); 
			file_path = file.getAbsolutePath();
			
			output.dialog("成功生成过程接口中非标准字段使用情况分析报告，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
			output.info("成功生成过程接口中非标准字段使用情况分析报告，生成路径为" + file_path);//信息输出，控制台输出信息。
		}else{
			output. dialog("无存储过程，无法生成过程接口中非标准字段使用情况分析报告！");//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
			output.info("无存储过程，无法生成过程接口中非标准字段使用情况分析报告！");//信息输出，控制台输出信息。
		}
	}
	